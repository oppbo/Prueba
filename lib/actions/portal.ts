"use server";

import { randomUUID } from "node:crypto";
import { PROOF_MAX_BYTES, validateUpload } from "@/lib/files";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";
import { TOKEN_PATTERN } from "@/lib/data/portal";
import { publicProofSchema } from "@/lib/validation/schemas";
import { dbErrorMessage, fail, fromZod, ok, type ActionResult } from "./result";

/**
 * Public (unauthenticated) proof submission. Security:
 * - token format checked, then validated by the DB function (active, not expired)
 * - file type sniffed from magic bytes, size capped, name generated server-side
 * - file stored in a private bucket under the link's organization folder
 * - the payment is created as pending_verification: it never changes a balance
 */
export async function submitPaymentProof(token: string, formData: FormData): Promise<ActionResult> {
  if (typeof token !== "string" || !TOKEN_PATTERN.test(token)) return fail("El enlace de pago no es válido.");
  if (!isAdminConfigured()) return fail("El servicio no está disponible en este momento.");

  const parsed = publicProofSchema.safeParse({
    amount: formData.get("amount") ?? "",
    reference: formData.get("reference") ?? "",
    note: formData.get("note") ?? "",
  });
  if (!parsed.success) return fromZod(parsed.error);

  const upload = await validateUpload(formData.get("proof"), {
    maxBytes: PROOF_MAX_BYTES,
    allowed: ["image/png", "image/jpeg", "image/webp", "application/pdf"],
  });
  if (!upload.ok) return fail("Revisa los campos marcados.", { proof: upload.error === "Formato no permitido." ? "Sube una imagen JPG o PNG, o un PDF." : upload.error });

  const admin = createAdminClient();
  const { data: page } = await admin.rpc("get_payment_page", { p_token: token });
  const info = page as { organization?: { id: string }; invoice?: { id: string } } | null;
  if (!info?.organization || !info.invoice) return fail("El enlace de pago no es válido o expiró.");

  const path = `${info.organization.id}/${info.invoice.id}/${randomUUID()}.${upload.type.ext}`;
  const { error: uploadError } = await admin.storage.from("payment-proofs").upload(path, await upload.file.arrayBuffer(), {
    contentType: upload.type.mime,
    upsert: false,
  });
  if (uploadError) return fail("No pudimos guardar el comprobante. Intenta nuevamente.");

  const { error } = await admin.rpc("submit_payment_proof", {
    p_token: token,
    p_amount: parsed.data.amount,
    p_proof_path: path,
    p_reference: parsed.data.reference,
    p_note: parsed.data.note,
  });
  if (error) {
    await admin.storage.from("payment-proofs").remove([path]);
    return fail(dbErrorMessage(error, "No pudimos registrar tu comprobante. Intenta nuevamente."));
  }
  return ok(null);
}
