import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PaymentRow, PaymentStatus } from "@/types/database";

export const PAYMENT_TABS = ["pending", "verified", "rejected"] as const;
export type PaymentTab = (typeof PAYMENT_TABS)[number];
const STATUS: Record<PaymentTab, PaymentStatus> = { pending: "pending_verification", verified: "verified", rejected: "rejected" };

export type PaymentListItem = PaymentRow & {
  customer_name: string;
  invoice_number: string | null;
  invoice_outstanding: number | null;
  proof_url: string | null;
  proof_is_pdf: boolean;
};

export async function listPayments(organizationId: string, tab: PaymentTab) {
  const supabase = await createClient();
  const [listRes, ...countRes] = await Promise.all([
    supabase
      .from("payments")
      .select("*, customers(name), invoices(invoice_number, outstanding_amount)")
      .eq("organization_id", organizationId)
      .eq("status", STATUS[tab])
      .order(tab === "pending" ? "created_at" : "updated_at", { ascending: tab === "pending" })
      .limit(100),
    ...PAYMENT_TABS.map((t) =>
      supabase.from("payments").select("id", { count: "exact", head: true }).eq("organization_id", organizationId).eq("status", STATUS[t]),
    ),
  ]);
  if (listRes.error) throw new Error(`payments query failed: ${listRes.error.message}`);

  const rows = listRes.data ?? [];
  const paths = rows.map((r) => r.proof_path).filter((p): p is string => Boolean(p));
  const signed = new Map<string, string>();
  if (paths.length) {
    // Signed with the user's session: storage RLS only signs files of their organization.
    const { data } = await supabase.storage.from("payment-proofs").createSignedUrls(paths, 60 * 30);
    for (const item of data ?? []) if (item.path && item.signedUrl) signed.set(item.path, item.signedUrl);
  }

  const items: PaymentListItem[] = rows.map((r) => {
    const invoice = r.invoices as { invoice_number: string; outstanding_amount: number } | null;
    return {
      ...(r as PaymentRow),
      customer_name: (r.customers as { name: string } | null)?.name ?? "Cliente",
      invoice_number: invoice?.invoice_number ?? null,
      invoice_outstanding: invoice ? Number(invoice.outstanding_amount) : null,
      proof_url: r.proof_path ? (signed.get(r.proof_path) ?? null) : null,
      proof_is_pdf: Boolean(r.proof_path?.endsWith(".pdf")),
    };
  });

  const [pending, verified, rejected] = countRes.map((c) => c.count ?? 0);
  return { items, counts: { pending, verified, rejected } };
}
