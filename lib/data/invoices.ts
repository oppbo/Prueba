import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { InvoiceOverviewRow, PaymentRow } from "@/types/database";
import type { TimelineEvent } from "@/components/dashboard/activity-feed";
import { sanitizeSearch } from "./query";

export const INVOICES_PAGE_SIZE = 25;
export const INVOICE_FILTERS = ["all", "pending", "overdue", "paid"] as const;
export type InvoiceFilter = (typeof INVOICE_FILTERS)[number];

export async function listInvoices({
  organizationId,
  filter,
  q,
  page,
}: {
  organizationId: string;
  filter: InvoiceFilter;
  q?: string;
  page: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("invoice_overview")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .range((page - 1) * INVOICES_PAGE_SIZE, page * INVOICES_PAGE_SIZE - 1);

  if (filter === "pending") query = query.in("effective_status", ["pending", "partially_paid"]).order("due_date", { ascending: true });
  else if (filter === "overdue") query = query.eq("effective_status", "overdue").order("days_overdue", { ascending: false });
  else if (filter === "paid") query = query.eq("effective_status", "paid").order("updated_at", { ascending: false });
  else query = query.order("issue_date", { ascending: false }).order("created_at", { ascending: false });

  const term = sanitizeSearch(q);
  if (term) query = query.or(`invoice_number.ilike.*${term}*,customer_name.ilike.*${term}*`);

  const { data, count, error } = await query;
  if (error) throw new Error(`invoices query failed: ${error.message}`);
  return { rows: (data ?? []) as InvoiceOverviewRow[], total: count ?? 0 };
}

export async function countInvoicesByFilter(organizationId: string) {
  const supabase = await createClient();
  const base = () => supabase.from("invoice_overview").select("id", { count: "exact", head: true }).eq("organization_id", organizationId);
  const [all, pending, overdue, paid] = await Promise.all([
    base(),
    base().in("effective_status", ["pending", "partially_paid"]),
    base().eq("effective_status", "overdue"),
    base().eq("effective_status", "paid"),
  ]);
  return { all: all.count ?? 0, pending: pending.count ?? 0, overdue: overdue.count ?? 0, paid: paid.count ?? 0 };
}

export async function getInvoiceDetail(organizationId: string, invoiceId: string) {
  const supabase = await createClient();
  const { data: invoice, error } = await supabase
    .from("invoice_overview")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", invoiceId)
    .maybeSingle();
  if (error) throw new Error(`invoice query failed: ${error.message}`);
  if (!invoice) return null;

  const [paymentsRes, eventsRes, linkRes] = await Promise.all([
    supabase
      .from("payments")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false }),
    supabase
      .from("collection_events")
      .select("id, event_type, message, created_at")
      .eq("organization_id", organizationId)
      .eq("invoice_id", invoiceId)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("public_payment_links")
      .select("token")
      .eq("organization_id", organizationId)
      .eq("invoice_id", invoiceId)
      .eq("active", true)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const payments = (paymentsRes.data ?? []) as PaymentRow[];
  const events: TimelineEvent[] = (eventsRes.data ?? []).map((e) => ({ ...e }));
  const paid = payments.filter((p) => p.status === "verified").reduce((acc, p) => acc + Number(p.amount), 0);

  return {
    invoice: invoice as InvoiceOverviewRow,
    payments,
    events,
    paid: Math.round(paid * 100) / 100,
    paymentToken: linkRes.data?.token ?? null,
  };
}
