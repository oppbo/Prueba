"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { getSiteUrl } from "@/lib/site-url";
import { uuid } from "@/lib/validation/common";
import { noteSchema, recordPaymentSchema, whatsappLogSchema } from "@/lib/validation/schemas";
import { dbErrorMessage, fail, fromZod, ok, type ActionResult } from "./result";

/** Returns the public payment URL for an invoice, creating the link on first use. */
export async function preparePaymentLink(invoiceId: string): Promise<ActionResult<{ url: string }>> {
  await requireSession();
  const parsed = uuid.safeParse(invoiceId);
  if (!parsed.success) return fail("Factura no válida.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_or_create_payment_link", { p_invoice_id: parsed.data });
  if (error || !data) return fail(dbErrorMessage(error, "No se pudo generar el link de pago."));
  return ok({ url: `${await getSiteUrl()}/p/${data}` });
}

/** Logs that the user opened WhatsApp with a reminder. Delivery is NOT confirmed. */
export async function logWhatsAppOpened(input: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = whatsappLogSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();

  const { data: invoice } = await supabase
    .from("invoices")
    .select("id, customer_id, organization_id")
    .eq("id", parsed.data.invoice_id)
    .eq("organization_id", session.organization.id)
    .maybeSingle();
  if (!invoice) return fail("La factura no existe o no tienes acceso.");

  const { error } = await supabase.from("collection_events").insert({
    organization_id: invoice.organization_id,
    customer_id: invoice.customer_id,
    invoice_id: invoice.id,
    event_type: "whatsapp_opened",
    message: parsed.data.message.slice(0, 2000),
    created_by: session.userId,
  });
  if (error) return fail(dbErrorMessage(error));
  revalidatePath("/dashboard", "layout");
  return ok(null);
}

export async function addNote(input: unknown): Promise<ActionResult> {
  const session = await requireSession();
  const parsed = noteSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.customer_id)
    .eq("organization_id", session.organization.id)
    .maybeSingle();
  if (!customer) return fail("El cliente no existe o no tienes acceso.");

  const { error } = await supabase.from("collection_events").insert({
    organization_id: session.organization.id,
    customer_id: customer.id,
    invoice_id: parsed.data.invoice_id ?? null,
    event_type: "note_added",
    message: parsed.data.message,
    created_by: session.userId,
  });
  if (error) return fail(dbErrorMessage(error));
  revalidatePath("/dashboard", "layout");
  return ok(null, "Nota guardada");
}

export async function recordPayment(input: unknown): Promise<ActionResult<{ outstanding: number }>> {
  await requireSession();
  const parsed = recordPaymentSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_payment", {
    p_invoice_id: parsed.data.invoice_id,
    p_amount: parsed.data.amount,
    p_payment_date: parsed.data.payment_date,
    p_method: parsed.data.payment_method,
    p_reference: parsed.data.reference,
    p_notes: parsed.data.notes,
  });
  if (error) return fail(dbErrorMessage(error, "No se pudo registrar el pago."));
  revalidatePath("/dashboard", "layout");
  const outstanding = Number((data as { outstanding_amount?: number } | null)?.outstanding_amount ?? 0);
  return ok({ outstanding }, "Pago registrado");
}
