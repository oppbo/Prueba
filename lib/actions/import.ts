"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeName, validateRows, type MappedRow, type ValidRow } from "@/lib/csv/import";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { fail, ok, type ActionResult } from "./result";

const MAX_ROWS = 2000;
const cell = z.string().max(500).optional();
const rowSchema = z.object({
  row: z.number().int().positive(),
  customer: cell,
  phone: cell,
  nit: cell,
  invoice_number: cell,
  issue_date: cell,
  due_date: cell,
  amount: cell,
  description: cell,
});

export type ImportSummary = {
  invoicesCreated: number;
  customersCreated: number;
  customersMatched: number;
  skipped: { row: number; errors: string[] }[];
};

export async function importInvoices(input: unknown): Promise<ActionResult<ImportSummary>> {
  const session = await requireSession();
  const parsed = z.array(rowSchema).min(1, "El archivo no tiene filas").max(MAX_ROWS, `Máximo ${MAX_ROWS} filas por importación`).safeParse(input);
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? "Datos no válidos.");

  const orgId = session.organization.id;
  const supabase = await createClient();

  // Re-validate on the server with the exact same rules as the preview.
  const results = validateRows(parsed.data as MappedRow[]);
  const skipped: ImportSummary["skipped"] = [];
  let valid: ValidRow[] = [];
  for (const r of results) {
    if (r.ok) valid.push(r.value);
    else skipped.push({ row: r.row, errors: r.errors });
  }

  // Invoice numbers that already exist in this organization are skipped, not overwritten.
  if (valid.length) {
    const numbers = valid.map((v) => v.invoice_number);
    const existing = new Set<string>();
    for (let i = 0; i < numbers.length; i += 300) {
      const { data } = await supabase.from("invoices").select("invoice_number").eq("organization_id", orgId).in("invoice_number", numbers.slice(i, i + 300));
      for (const d of data ?? []) existing.add(d.invoice_number.toLowerCase());
    }
    valid = valid.filter((v) => {
      if (!existing.has(v.invoice_number.toLowerCase())) return true;
      skipped.push({ row: v.row, errors: [`La factura ${v.invoice_number} ya existe en CobraYa`] });
      return false;
    });
  }
  if (!valid.length) return ok({ invoicesCreated: 0, customersCreated: 0, customersMatched: 0, skipped: sortSkipped(skipped) });

  // Match customers by NIT first, then by normalized name; create the rest.
  const { data: customers, error: custErr } = await supabase.from("customers").select("id, name, nit").eq("organization_id", orgId).limit(10000);
  if (custErr) return fail("No se pudo leer tus clientes. Intenta nuevamente.");
  const byNit = new Map<string, string>();
  const byName = new Map<string, string>();
  for (const c of customers ?? []) {
    if (c.nit) byNit.set(c.nit, c.id);
    byName.set(normalizeName(c.name), c.id);
  }
  const resolve = (v: ValidRow) => (v.nit && byNit.get(v.nit)) || byName.get(normalizeName(v.customer));

  const toCreate = new Map<string, { name: string; phone: string; nit: string | null }>();
  let matched = 0;
  const matchedIds = new Set<string>();
  for (const v of valid) {
    const id = resolve(v);
    if (id) {
      if (!matchedIds.has(id)) matched++;
      matchedIds.add(id);
      continue;
    }
    const key = v.nit ? `nit:${v.nit}` : `name:${normalizeName(v.customer)}`;
    if (!toCreate.has(key)) toCreate.set(key, { name: v.customer, phone: v.phone, nit: v.nit });
  }

  if (toCreate.size) {
    const { data: created, error } = await supabase
      .from("customers")
      .insert([...toCreate.values()].map((c) => ({ ...c, organization_id: orgId, city: session.organization.city })))
      .select("id, name, nit");
    if (error) return fail("No se pudieron crear los clientes nuevos. No se importó ninguna factura.");
    for (const c of created ?? []) {
      if (c.nit) byNit.set(c.nit, c.id);
      byName.set(normalizeName(c.name), c.id);
    }
  }

  let invoicesCreated = 0;
  for (let i = 0; i < valid.length; i += 500) {
    const chunk = valid.slice(i, i + 500);
    const { data: inserted, error } = await supabase
      .from("invoices")
      .insert(
        chunk.map((v) => ({
          organization_id: orgId,
          customer_id: resolve(v) as string,
          invoice_number: v.invoice_number,
          description: v.description,
          issue_date: v.issue_date,
          due_date: v.due_date,
          original_amount: v.amount,
        })),
      )
      .select("id, customer_id, invoice_number");
    if (error) {
      for (const v of chunk) skipped.push({ row: v.row, errors: ["No se pudo guardar (posible número duplicado)"] });
      continue;
    }
    invoicesCreated += inserted?.length ?? 0;
    if (inserted?.length) {
      await supabase.from("collection_events").insert(
        inserted.map((inv) => ({
          organization_id: orgId,
          customer_id: inv.customer_id,
          invoice_id: inv.id,
          event_type: "invoice_created" as const,
          message: "Importada desde CSV",
          created_by: session.userId,
        })),
      );
    }
  }

  revalidatePath("/dashboard", "layout");
  return ok({ invoicesCreated, customersCreated: toCreate.size, customersMatched: matched, skipped: sortSkipped(skipped) });
}

function sortSkipped(s: ImportSummary["skipped"]) {
  return s.sort((a, b) => a.row - b.row);
}
