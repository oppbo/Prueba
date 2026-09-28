import "server-only";
import { createClient } from "@/lib/supabase/server";
import { addDaysIso, todayBo } from "@/lib/format";
import type { InvoiceOverviewRow } from "@/types/database";

export const COLLECTION_SEGMENTS = ["overdue", "soon", "nocontact"] as const;
export type CollectionSegment = (typeof COLLECTION_SEGMENTS)[number];
export const NO_CONTACT_DAYS = 7;

export async function getCollectionQueue(organizationId: string, segment: CollectionSegment) {
  const supabase = await createClient();
  const today = todayBo();
  const soonEnd = addDaysIso(today, 7);
  const contactCutoff = new Date(Date.now() - NO_CONTACT_DAYS * 86_400_000).toISOString();

  const open = () =>
    supabase
      .from("invoice_overview")
      .select("*", { count: "exact" })
      .eq("organization_id", organizationId)
      .gt("outstanding_amount", 0);

  const overdueQ = () => open().eq("effective_status", "overdue");
  const soonQ = () => open().in("effective_status", ["pending", "partially_paid"]).gte("due_date", today).lte("due_date", soonEnd);
  const noContactQ = () =>
    open()
      .in("effective_status", ["pending", "partially_paid", "overdue"])
      .or(`last_contact_at.is.null,last_contact_at.lt.${contactCutoff}`);

  const list =
    segment === "overdue"
      ? overdueQ().order("days_overdue", { ascending: false }).order("outstanding_amount", { ascending: false })
      : segment === "soon"
        ? soonQ().order("due_date", { ascending: true }).order("outstanding_amount", { ascending: false })
        : noContactQ().order("days_overdue", { ascending: false }).order("outstanding_amount", { ascending: false });

  const [rowsRes, overdueCount, soonCount, noContactCount] = await Promise.all([
    list.limit(100),
    overdueQ().limit(1),
    soonQ().limit(1),
    noContactQ().limit(1),
  ]);
  if (rowsRes.error) throw new Error(`collections query failed: ${rowsRes.error.message}`);

  const rows = (rowsRes.data ?? []) as InvoiceOverviewRow[];
  return {
    today,
    rows,
    total: rows.reduce((acc, r) => acc + Number(r.outstanding_amount), 0),
    counts: { overdue: overdueCount.count ?? 0, soon: soonCount.count ?? 0, nocontact: noContactCount.count ?? 0 },
  };
}
