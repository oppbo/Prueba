"use server";

import { revalidatePath } from "next/cache";
import { formatBs } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";
import { invoiceSchema } from "@/lib/validation/schemas";
import { dbErrorMessage, fail, fromZod, ok, type ActionResult } from "./result";

function duplicateNumber(error: { code?: string } | null) {
  return error?.code === "23505";
}

export async function createInvoice(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const orgId = session.organization.id;

  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("id", parsed.data.customer_id)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!customer) return fail("Revisa los campos marcados.", { customer_id: "Selecciona un cliente válido" });

  const { amount, ...rest } = parsed.data;
  const { data, error } = await supabase
    .from("invoices")
    .insert({ ...rest, original_amount: amount, organization_id: orgId })
    .select("id")
    .single();
  if (duplicateNumber(error)) return fail("Revisa los campos marcados.", { invoice_number: "Ya existe una factura con este número" });
  if (error || !data) return fail(dbErrorMessage(error, "No se pudo crear la factura."));

  await supabase.from("collection_events").insert({
    organization_id: orgId,
    customer_id: customer.id,
    invoice_id: data.id,
    event_type: "invoice_created",
    message: `Factura ${rest.invoice_number} por ${formatBs(amount)}`,
    created_by: session.userId,
  });
  revalidatePath("/dashboard", "layout");
  return ok({ id: data.id }, "Factura creada");
}

export async function updateInvoice(invoiceId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const id = uuid.safeParse(invoiceId);
  if (!id.success) return fail("Factura no válida.");
  const parsed = invoiceSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();
  const orgId = session.organization.id;

  const { data: current } = await supabase
    .from("invoices")
    .select("id, status, customer_id")
    .eq("id", id.data)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!current) return fail("La factura no existe o no tienes acceso.");
  if (current.status === "cancelled") return fail("Las facturas anuladas no se pueden editar.");

  const { data: verified } = await supabase
    .from("payments")
    .select("amount")
    .eq("invoice_id", current.id)
    .eq("status", "verified");
  const paid = (verified ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
  if (parsed.data.amount < paid) {
    return fail("Revisa los campos marcados.", { amount: `No puede ser menor a lo ya pagado (${formatBs(paid)})` });
  }
  if (paid > 0 && parsed.data.customer_id !== current.customer_id) {
    return fail("Revisa los campos marcados.", { customer_id: "No se puede cambiar el cliente de una factura con pagos" });
  }

  const { amount, ...rest } = parsed.data;
  const { error } = await supabase
    .from("invoices")
    .update({ ...rest, original_amount: amount })
    .eq("id", current.id)
    .eq("organization_id", orgId);
  if (duplicateNumber(error)) return fail("Revisa los campos marcados.", { invoice_number: "Ya existe una factura con este número" });
  if (error) return fail(dbErrorMessage(error, "No se pudo actualizar la factura."));

  await supabase.from("collection_events").insert({
    organization_id: orgId,
    customer_id: rest.customer_id,
    invoice_id: current.id,
    event_type: "invoice_updated",
    message: "Datos de la factura actualizados",
    created_by: session.userId,
  });
  revalidatePath("/dashboard", "layout");
  return ok({ id: current.id }, "Factura actualizada");
}

export async function cancelInvoice(invoiceId: string): Promise<ActionResult> {
  const session = await requireSession();
  const id = uuid.safeParse(invoiceId);
  if (!id.success) return fail("Factura no válida.");
  const supabase = await createClient();
  const orgId = session.organization.id;

  const { data: current } = await supabase
    .from("invoices")
    .select("id, status, customer_id")
    .eq("id", id.data)
    .eq("organization_id", orgId)
    .maybeSingle();
  if (!current) return fail("La factura no existe o no tienes acceso.");
  if (current.status === "cancelled") return fail("La factura ya está anulada.");

  const { count } = await supabase
    .from("payments")
    .select("id", { count: "exact", head: true })
    .eq("invoice_id", current.id)
    .in("status", ["verified", "pending_verification"]);
  if ((count ?? 0) > 0) return fail("No se puede anular: la factura tiene pagos registrados o comprobantes por verificar.");

  const { error } = await supabase.from("invoices").update({ status: "cancelled" }).eq("id", current.id).eq("organization_id", orgId);
  if (error) return fail(dbErrorMessage(error, "No se pudo anular la factura."));

  await supabase.from("public_payment_links").update({ active: false }).eq("invoice_id", current.id).eq("organization_id", orgId);
  await supabase.from("collection_events").insert({
    organization_id: orgId,
    customer_id: current.customer_id,
    invoice_id: current.id,
    event_type: "invoice_updated",
    message: "Factura anulada",
    created_by: session.userId,
  });
  revalidatePath("/dashboard", "layout");
  return ok(null, "Factura anulada");
}
