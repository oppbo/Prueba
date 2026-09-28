"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";
import { rejectPaymentSchema } from "@/lib/validation/schemas";
import { dbErrorMessage, fail, fromZod, ok, type ActionResult } from "./result";

/**
 * Verification runs in the verify_payment() RPC: row lock + status guard, and the
 * invoice balance is derived from verified payments, so a double click, two tabs
 * or two teammates can never reduce a balance twice.
 */
export async function verifyPayment(paymentId: string): Promise<ActionResult<{ outstanding: number | null }>> {
  await requireSession();
  const id = uuid.safeParse(paymentId);
  if (!id.success) return fail("Pago no válido.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("verify_payment", { p_payment_id: id.data });
  if (error) return fail(dbErrorMessage(error, "No se pudo verificar el pago."));
  revalidatePath("/dashboard", "layout");
  const outstanding = (data as { outstanding_amount?: number | null } | null)?.outstanding_amount;
  return ok({ outstanding: outstanding === undefined || outstanding === null ? null : Number(outstanding) }, "Pago verificado");
}

export async function rejectPayment(input: unknown): Promise<ActionResult> {
  await requireSession();
  const parsed = rejectPaymentSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { error } = await supabase.rpc("reject_payment", { p_payment_id: parsed.data.payment_id, p_reason: parsed.data.reason });
  if (error) return fail(dbErrorMessage(error, "No se pudo rechazar el pago."));
  revalidatePath("/dashboard", "layout");
  return ok(null, "Comprobante rechazado");
}
