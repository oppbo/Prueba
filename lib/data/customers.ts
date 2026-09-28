import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { CustomerOverviewRow, InvoiceOverviewRow, PaymentRow } from "@/types/database";
import { sanitizeSearch } from "./query";
import type { TimelineEvent } from "@/components/dashboard/activity-feed";

export const CUSTOMERS_PAGE_SIZE = 20;

export async function listCustomers({
  organizationId,
  q,
  status,
  page,
}: {
  organizationId: string;
  q?: string;
  status: "all" | "active" | "inactive";
  page: number;
}) {
  const supabase = await createClient();
  let query = supabase
    .from("customer_overview")
    .select("*", { count: "exact" })
    .eq("organization_id", organizationId)
    .order("balance", { ascending: false })
    .order("name", { ascending: true })
    .range((page - 1) * CUSTOMERS_PAGE_SIZE, page * CUSTOMERS_PAGE_SIZE - 1);

  if (status !== "all") query = query.eq("status", status);
  const term = sanitizeSearch(q);
  if (term) {
    query = query.or(`name.ilike.*${term}*,business_name.ilike.*${term}*,nit.ilike.*${term}*,phone.ilike.*${term}*`);
  }

  const { data, count, error } = await query;
  if (error) throw new Error(`customers query failed: ${error.message}`);
  return { rows: (data ?? []) as CustomerOverviewRow[], total: count ?? 0 };
}

export async function countCustomersByStatus(organizationId: string) {
  const supabase = await createClient();
  const [all, active] = await Promise.all([
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId),
    supabase.from("customers").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", "active"),
  ]);
  const total = all.count ?? 0;
  const activeCount = active.count ?? 0;
  return { all: total, active: activeCount, inactive: total - activeCount };
}

export async function getCustomerDetail(organizationId: string, customerId: string) {
  const supabase = await createClient();
  const { data: customer, error } = await supabase
    .from("customer_overview")
    .select("*")
    .eq("organization_id", organizationId)
    .eq("id", customerId)
    .maybeSingle();
  if (error) throw new Error(`customer query failed: ${error.message}`);
  if (!customer) return null;

  const [invoicesRes, paymentsRes, eventsRes] = await Promise.all([
    supabase
      .from("invoice_overview")
      .select("*")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .order("due_date", { ascending: true }),
    supabase
      .from("payments")
      .select("*, invoices(invoice_number)")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("collection_events")
      .select("id, event_type, message, created_at, invoice_id, invoices(invoice_number)")
      .eq("organization_id", organizationId)
      .eq("customer_id", customerId)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  const invoices = (invoicesRes.data ?? []) as InvoiceOverviewRow[];
  const payments = (paymentsRes.data ?? []).map((p) => ({
    ...(p as PaymentRow),
    invoice_number: (p.invoices as { invoice_number: string } | null)?.invoice_number ?? null,
  }));
  const events: TimelineEvent[] = (eventsRes.data ?? []).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    message: e.message,
    created_at: e.created_at,
    invoice_id: e.invoice_id,
    invoice_number: (e.invoices as { invoice_number: string } | null)?.invoice_number ?? null,
  }));

  return { customer: customer as CustomerOverviewRow, invoices, payments, events };
}

export async function listCustomerOptions(organizationId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("customers")
    .select("id, name, business_name, status")
    .eq("organization_id", organizationId)
    .order("name")
    .limit(1000);
  return data ?? [];
}
