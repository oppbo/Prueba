"use server";

import { redirect } from "next/navigation";
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
 * Signs into the shared demo account (fictional data only). Credentials live in
 * server-side env vars; when they are not configured the visitor is sent to signup.
 */
export async function signInDemo(): Promise<ActionResult> {
  const email = process.env.DEMO_USER_EMAIL;
  const password = process.env.DEMO_USER_PASSWORD;
  if (!isSupabaseConfigured() || !email || !password) redirect("/signup?demo=unavailable");

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return fail("La demo no está disponible en este momento. Crea una cuenta gratuita para probar CobraYa.");
  redirect("/dashboard");
}
