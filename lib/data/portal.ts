import "server-only";
import { createAdminClient, isAdminConfigured } from "@/lib/supabase/admin";

export type PaymentPageData = {
  organization: {
    id: string;
    name: string;
    legal_name: string | null;
    city: string | null;
    phone: string | null;
    bank_name: string | null;
    bank_account_name: string | null;
    bank_account_number: string | null;
    bank_qr_path: string | null;
  };
  customer: { name: string };
  invoice: {
    id: string;
    invoice_number: string;
    description: string | null;
    issue_date: string;
    due_date: string;
    original_amount: number;
    outstanding_amount: number;
    status: string;
    is_overdue: boolean;
  };
  pending_amount: number;
};

export const TOKEN_PATTERN = /^[0-9a-f]{64}$/;

/** Token-validated lookup through a SECURITY DEFINER RPC (service role only). */
export async function getPaymentPage(token: string): Promise<{ data: PaymentPageData; qrUrl: string | null } | null> {
  if (!TOKEN_PATTERN.test(token) || !isAdminConfigured()) return null;
  const admin = createAdminClient();
  const { data, error } = await admin.rpc("get_payment_page", { p_token: token });
  if (error || !data) return null;
  const page = data as unknown as PaymentPageData;

  let qrUrl: string | null = null;
  if (page.organization.bank_qr_path) {
    const { data: signed } = await admin.storage.from("org-assets").createSignedUrl(page.organization.bank_qr_path, 60 * 60);
    qrUrl = signed?.signedUrl ?? null;
  }
  return { data: page, qrUrl };
}
