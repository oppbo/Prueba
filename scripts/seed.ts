/**
 * Seeds (or resets) the fixed demo login "Distribuidora Andina SRL".
 *
 *   npm run seed
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_EMAIL and
 * DEMO_USER_PASSWORD (read from .env.local or the environment). Safe to re-run: it
 * only deletes and recreates data belonging to the demo user's organization.
 * All businesses, people and phone numbers are fictional.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { DEMO_PROFILE, seedDemoOrganization } from "../lib/demo/seed-data";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.DEMO_USER_EMAIL;
const password = process.env.DEMO_USER_PASSWORD;

if (!url || !serviceKey || !email || !password) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, DEMO_USER_EMAIL, DEMO_USER_PASSWORD");
  process.exit(1);
}

const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

async function getOrCreateDemoUser(): Promise<string> {
  const metadata = DEMO_PROFILE;
  for (let page = 1; page < 50; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase());
    if (found) {
      await admin.auth.admin.updateUserById(found.id, { password, email_confirm: true, user_metadata: metadata });
      return found.id;
    }
    if (data.users.length < 200) break;
  }
  const { data, error } = await admin.auth.admin.createUser({ email: email!, password: password!, email_confirm: true, user_metadata: metadata });
  if (error || !data.user) throw error ?? new Error("could not create demo user");
  return data.user.id;
}

async function main() {
  console.log(`Seeding demo data for ${email}`);
  const userId = await getOrCreateDemoUser();
  await admin.from("profiles").upsert({ id: userId, full_name: DEMO_PROFILE.full_name, phone: "+591 70000100" });

  const { data: membership } = await admin
    .from("organization_members")
    .select("organization_id")
    .eq("user_id", userId)
    .order("created_at")
    .limit(1)
    .maybeSingle();
  if (!membership) throw new Error("demo user has no organization (did the migrations run?)");

  const result = await seedDemoOrganization(admin, userId, membership.organization_id);
  console.log(`✔ ${result.customers} customers, ${result.invoices} invoices, ${result.payments} payments, ${result.events} events`);
  console.log(`✔ Demo login: ${email}`);
  if (result.sampleToken) console.log(`✔ Sample payment page: /p/${result.sampleToken}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
