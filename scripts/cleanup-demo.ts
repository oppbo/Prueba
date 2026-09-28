/**
 * Deletes "Probar demo" sandboxes older than DEMO_TTL_HOURS (default 24):
 * their storage files, organization (cascades all data) and auth user.
 *
 *   npm run demo:cleanup
 *
 * Only users whose email ends with the sandbox domain AND carry is_demo metadata
 * are touched. Schedule it daily (e.g. GitHub Actions cron) in production.
 */
import { config } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../types/database";
import { DEMO_SANDBOX_DOMAIN } from "../lib/demo/seed-data";

config({ path: ".env.local" });
config();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !serviceKey) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
const ttlHours = Number(process.env.DEMO_TTL_HOURS ?? 24);
const cutoff = Date.now() - ttlHours * 3_600_000;

async function removeFolder(bucket: string, prefix: string) {
  const { data } = await admin.storage.from(bucket).list(prefix, { limit: 1000 });
  const files: string[] = [];
  for (const item of data ?? []) {
    if (item.id) files.push(`${prefix}/${item.name}`);
    else await removeFolder(bucket, `${prefix}/${item.name}`);
  }
  if (files.length) await admin.storage.from(bucket).remove(files);
}

async function main() {
  let removed = 0;
  for (let page = 1; page < 100; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const stale = data.users.filter(
      (u) => u.email?.endsWith(`@${DEMO_SANDBOX_DOMAIN}`) && u.user_metadata?.is_demo === true && new Date(u.created_at).getTime() < cutoff,
    );
    for (const user of stale) {
      const { data: memberships } = await admin.from("organization_members").select("organization_id").eq("user_id", user.id);
      for (const m of memberships ?? []) {
        await removeFolder("org-assets", m.organization_id);
        await removeFolder("payment-proofs", m.organization_id);
        await admin.from("organizations").delete().eq("id", m.organization_id);
      }
      await admin.auth.admin.deleteUser(user.id);
      removed++;
    }
    if (data.users.length < 200) break;
  }
  console.log(`✔ Removed ${removed} demo sandboxes older than ${ttlHours}h`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
