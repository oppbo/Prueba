import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addDaysIso, startOfMonthIso, todayBo } from "@/lib/format";
import type { CollectionEventType, InvoiceOverviewRow } from "@/types/database";

export type ActivityItem = {
  id: string;
  event_type: CollectionEventType;
  message: string | null;
  created_at: string;
  customer_id: string;
  invoice_id: string | null;
  customer_name: string;
  invoice_number: string | null;
};

export type MonthPoint = { month: string; collected: number; outstanding: number };

const OPEN_STATUSES = ["pending", "partially_paid", "overdue"] as const;

export async function getDashboardData(organizationId: string) {
  const supabase = await createClient();
  const today = todayBo();
  const weekEnd = addDaysIso(today, 7);
  const monthStart = startOfMonthIso(today);
  // First day of the month five months ago => six-month window.
  const [y, m] = today.split("-").map(Number);
  const windowStart = new Date(Date.UTC(y, m - 1 - 5, 1)).toISOString().slice(0, 10);

  const [openRes, paymentsRes, invoicesRes, activityRes, pendingProofsRes] = await Promise.all([
    supabase
      .from("invoice_overview")
      .select("*")
      .eq("organization_id", organizationId)
      .in("status", [...OPEN_STATUSES])
      .gt("outstanding_amount", 0),
    supabase
      .from("payments")
      .select("amount, payment_date, invoice_id")
      .eq("organization_id", organizationId)
      .eq("status", "verified"),
    supabase
      .from("invoices")
      .select("id, issue_date, original_amount, status")
      .eq("organization_id", organizationId)
      .neq("status", "cancelled"),
    supabase
      .from("collection_events")
      .select("id, event_type, message, created_at, customer_id, invoice_id, customers(name), invoices(invoice_number)")
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("payments")
      .select("amount")
      .eq("organization_id", organizationId)
      .eq("status", "pending_verification"),
  ]);

  const firstError = openRes.error ?? paymentsRes.error ?? invoicesRes.error ?? activityRes.error ?? pendingProofsRes.error;
  if (firstError) throw new Error(`dashboard query failed: ${firstError.message}`);

  const open = (openRes.data ?? []) as InvoiceOverviewRow[];
  const payments = paymentsRes.data ?? [];
  const invoices = invoicesRes.data ?? [];
  const liveInvoiceIds = new Set(invoices.map((i) => i.id));

  const totalReceivable = sum(open.map((i) => i.outstanding_amount));
  const overdue = open.filter((i) => i.effective_status === "overdue");
  const dueThisWeek = open.filter((i) => i.due_date >= today && i.due_date <= weekEnd);
  const collectedThisMonth = sum(payments.filter((p) => p.payment_date >= monthStart && p.payment_date <= today).map((p) => p.amount));

  const attention = [...overdue]
    .sort((a, b) => b.days_overdue - a.days_overdue || b.outstanding_amount - a.outstanding_amount)
    .slice(0, 6);
  const upcoming = [...dueThisWeek].sort((a, b) => a.due_date.localeCompare(b.due_date)).slice(0, 6);

  // Month-end receivable balance = invoiced to date − verified payments to date.
  const months: MonthPoint[] = [];
  for (let i = 0; i < 6; i++) {
    const start = new Date(Date.UTC(y, m - 1 - 5 + i, 1));
    const end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
    const startIso = start.toISOString().slice(0, 10);
    const cutoff = end < today ? end : today;
    const invoiced = sum(invoices.filter((inv) => inv.issue_date <= cutoff).map((inv) => inv.original_amount));
    const paidToDate = sum(
      payments.filter((p) => p.payment_date <= cutoff && (!p.invoice_id || liveInvoiceIds.has(p.invoice_id))).map((p) => p.amount),
    );
    const collected = sum(payments.filter((p) => p.payment_date >= startIso && p.payment_date <= end).map((p) => p.amount));
    months.push({ month: startIso.slice(0, 7), collected: round(collected), outstanding: round(Math.max(invoiced - paidToDate, 0)) });
  }

  const activity: ActivityItem[] = (activityRes.data ?? []).map((e) => ({
    id: e.id,
    event_type: e.event_type,
    message: e.message,
    created_at: e.created_at,
    customer_id: e.customer_id,
    invoice_id: e.invoice_id,
    customer_name: (e.customers as { name: string } | null)?.name ?? "Cliente",
    invoice_number: (e.invoices as { invoice_number: string } | null)?.invoice_number ?? null,
  }));

  return {
    today,
    windowStart,
    metrics: {
      totalReceivable,
      openCount: open.length,
      overdueAmount: sum(overdue.map((i) => i.outstanding_amount)),
      overdueCount: overdue.length,
      collectedThisMonth,
      dueThisWeekAmount: sum(dueThisWeek.map((i) => i.outstanding_amount)),
      dueThisWeekCount: dueThisWeek.length,
      pendingProofsCount: pendingProofsRes.data?.length ?? 0,
      pendingProofsAmount: sum((pendingProofsRes.data ?? []).map((p) => p.amount)),
    },
    attention,
    upcoming,
    months,
    activity,
    hasInvoices: invoices.length > 0,
  };
}

function sum(values: Array<number | string>): number {
  return round(values.reduce<number>((acc, v) => acc + Number(v), 0));
}

function round(n: number) {
  return Math.round(n * 100) / 100;
}
