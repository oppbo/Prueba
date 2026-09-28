"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { QR_MAX_BYTES, validateUpload } from "@/lib/files";
import { canManageOrganization, requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { bankSchema, organizationSchema, templatesSchema } from "@/lib/validation/schemas";
import { dbErrorMessage, fail, fromZod, ok, type ActionResult } from "./result";

const FORBIDDEN = "Solo el propietario o un administrador puede cambiar la configuración.";

async function requireManager() {
  const session = await requireSession();
  return canManageOrganization(session.role) ? session : null;
}

export async function updateOrganization(input: unknown): Promise<ActionResult> {
  const session = await requireManager();
  if (!session) return fail(FORBIDDEN);
  const parsed = organizationSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(parsed.data).eq("id", session.organization.id);
  if (error) return fail(dbErrorMessage(error));
  revalidatePath("/dashboard", "layout");
  return ok(null, "Datos de la empresa guardados");
}

export async function updateBankDetails(input: unknown): Promise<ActionResult> {
  const session = await requireManager();
  if (!session) return fail(FORBIDDEN);
  const parsed = bankSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update(parsed.data).eq("id", session.organization.id);
  if (error) return fail(dbErrorMessage(error));
  revalidatePath("/dashboard", "layout");
  return ok(null, "Datos de pago guardados");
}

export async function uploadBankQr(formData: FormData): Promise<ActionResult> {
  const session = await requireManager();
  if (!session) return fail(FORBIDDEN);
  const upload = await validateUpload(formData.get("qr"), { maxBytes: QR_MAX_BYTES, allowed: ["image/png", "image/jpeg", "image/webp"] });
  if (!upload.ok) return fail(upload.error === "Formato no permitido." ? "Sube una imagen PNG, JPG o WebP." : upload.error);

  const supabase = await createClient();
  const orgId = session.organization.id;
  const path = `${orgId}/bank-qr-${randomUUID()}.${upload.type.ext}`;
  const { error: upErr } = await supabase.storage.from("org-assets").upload(path, await upload.file.arrayBuffer(), { contentType: upload.type.mime, upsert: false });
  if (upErr) return fail("No se pudo subir el QR. Intenta nuevamente.");

  const previous = session.organization.bank_qr_path;
  const { error } = await supabase.from("organizations").update({ bank_qr_path: path }).eq("id", orgId);
  if (error) {
    await supabase.storage.from("org-assets").remove([path]);
    return fail(dbErrorMessage(error));
  }
  if (previous) await supabase.storage.from("org-assets").remove([previous]);
  revalidatePath("/dashboard", "layout");
  return ok(null, "QR actualizado");
}

export async function removeBankQr(): Promise<ActionResult> {
  const session = await requireManager();
  if (!session) return fail(FORBIDDEN);
  const supabase = await createClient();
  const previous = session.organization.bank_qr_path;
  const { error } = await supabase.from("organizations").update({ bank_qr_path: null }).eq("id", session.organization.id);
  if (error) return fail(dbErrorMessage(error));
  if (previous) await supabase.storage.from("org-assets").remove([previous]);
  revalidatePath("/dashboard", "layout");
  return ok(null, "QR eliminado");
}

export async function updateTemplates(input: unknown): Promise<ActionResult> {
  const session = await requireManager();
  if (!session) return fail(FORBIDDEN);
  const parsed = templatesSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.from("organizations").update({ reminder_templates: parsed.data }).eq("id", session.organization.id);
  if (error) return fail(dbErrorMessage(error));
  revalidatePath("/dashboard", "layout");
  return ok(null, "Plantillas guardadas");
}
