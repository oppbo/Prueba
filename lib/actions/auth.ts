"use server";

import { randomBytes, randomUUID } from "node:crypto";
import { redirect } from "next/navigation";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { DEMO_PROFILE, DEMO_SANDBOX_DOMAIN, seedDemoOrganization } from "@/lib/demo/seed-data";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/env";
import { getSiteUrl, safeNextPath } from "@/lib/site-url";
import { loginSchema, signupSchema } from "@/lib/validation/schemas";
import { fail, fromZod, ok, type ActionResult } from "./result";

const NOT_CONFIGURED = "La aplicación aún no está conectada a Supabase. Revisa las variables de entorno.";

export async function signIn(input: unknown, next?: string): Promise<ActionResult> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    if (error.code === "email_not_confirmed") return fail("Confirma tu correo antes de iniciar sesión.");
    return fail("Correo o contraseña incorrectos.");
  }
  redirect(safeNextPath(next));
}

export async function signUp(input: unknown): Promise<ActionResult<{ needsConfirmation: boolean }>> {
  if (!isSupabaseConfigured()) return fail(NOT_CONFIGURED);
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const siteUrl = await getSiteUrl();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      emailRedirectTo: `${siteUrl}/auth/confirm?next=/dashboard`,
      data: { full_name: parsed.data.fullName, organization_name: parsed.data.organizationName },
    },
  });

  if (error) {
    if (error.code === "user_already_exists") return fail("Ya existe una cuenta con ese correo.");
    if (error.code === "weak_password") return fail("La contraseña es muy débil. Usa al menos 8 caracteres combinando letras y números.");
    return fail("No pudimos crear tu cuenta. Intenta nuevamente.");
  }
  if (data.session) redirect("/dashboard");
  return ok({ needsConfirmation: true });
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

/**
 * "Probar demo": creates a private, throwaway sandbox (its own user + organization)
 * filled with fictional data, and signs the visitor into it. Visitors never share
 * an account, so nobody can alter what another visitor sees or take over a shared
 * login. Sandboxes are removed by `npm run demo:cleanup`.
 */
export async function signInDemo(): Promise<ActionResult> {
  if (!isSupabaseConfigured() || !isAdminConfigured()) redirect("/signup?demo=unavailable");

  const admin = createAdminClient();
  const email = `demo-${randomUUID()}@${DEMO_SANDBOX_DOMAIN}`;
  const password = randomBytes(24).toString("base64url");
  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { ...DEMO_PROFILE, is_demo: true },
  });
  if (createError || !created.user) return fail("La demo no está disponible en este momento. Crea una cuenta gratuita para probar CobraYa.");

  try {
    const { data: membership } = await admin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", created.user.id)
      .single();
    if (!membership) throw new Error("sandbox organization missing");
    await seedDemoOrganization(admin, created.user.id, membership.organization_id);
  } catch (err) {
    console.error("demo sandbox seed failed", err);
    await admin.auth.admin.deleteUser(created.user.id);
    return fail("No pudimos preparar la demo. Intenta nuevamente en unos segundos.");
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail("No pudimos iniciar la demo. Intenta nuevamente.");
  redirect("/dashboard");
}
