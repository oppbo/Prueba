// Hand-maintained Supabase types mirroring supabase/migrations.
// Regenerate with `npx supabase gen types typescript --project-id <id>` if you prefer.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type MemberRole = "owner" | "admin" | "collector";
export type CustomerStatus = "active" | "inactive";
export type InvoiceStatus = "pending" | "partially_paid" | "paid" | "overdue" | "cancelled";
export type PaymentMethod = "bank_transfer" | "qr" | "cash" | "other";
export type PaymentStatus = "pending_verification" | "verified" | "rejected";
export type CollectionEventType =
  | "reminder_created"
  | "whatsapp_opened"
  | "note_added"
  | "payment_proof_received"
  | "payment_verified"
  | "payment_rejected"
  | "invoice_created"
  | "invoice_updated";

type Timestamps = { created_at: string; updated_at: string };

export type ProfileRow = Timestamps & { id: string; full_name: string | null; phone: string | null };

export type OrganizationRow = Timestamps & {
  id: string;
  name: string;
  legal_name: string | null;
  nit: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  bank_name: string | null;
  bank_account_name: string | null;
  bank_account_number: string | null;
  bank_qr_path: string | null;
  reminder_templates: Json;
};

export type OrganizationMemberRow = {
  id: string;
  organization_id: string;
  user_id: string;
  role: MemberRole;
  created_at: string;
};

export type CustomerRow = Timestamps & {
  id: string;
  organization_id: string;
  name: string;
  business_name: string | null;
  nit: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  notes: string | null;
  status: CustomerStatus;
};

export type InvoiceRow = Timestamps & {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_number: string;
  description: string | null;
  issue_date: string;
  due_date: string;
  original_amount: number;
  outstanding_amount: number;
  status: InvoiceStatus;
  notes: string | null;
};

export type PaymentRow = Timestamps & {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id: string | null;
  amount: number;
  payment_date: string;
  payment_method: PaymentMethod;
  reference: string | null;
  proof_path: string | null;
  status: PaymentStatus;
  notes: string | null;
  submitted_by_customer: boolean;
  verified_at: string | null;
  verified_by: string | null;
};

export type CollectionEventRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id: string | null;
  event_type: CollectionEventType;
  message: string | null;
  created_by: string | null;
  created_at: string;
};

export type PublicPaymentLinkRow = {
  id: string;
  organization_id: string;
  customer_id: string;
  invoice_id: string;
  token: string;
  active: boolean;
  expires_at: string | null;
  created_at: string;
};

export type InvoiceOverviewRow = Omit<InvoiceRow, never> & {
  customer_name: string;
  customer_business_name: string | null;
  customer_phone: string;
  effective_status: InvoiceStatus;
  days_overdue: number;
  last_contact_at: string | null;
};

export type CustomerOverviewRow = CustomerRow & {
  open_invoices: number;
  balance: number;
  overdue_balance: number;
  last_contact_at: string | null;
};

type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type Table<Row, Insert, Rel extends unknown[] = []> = {
  Row: Row;
  Insert: Insert;
  Update: Partial<Insert>;
  Relationships: Rel;
};

type Rel<Name extends string, Col extends string, Ref extends string> = {
  foreignKeyName: Name;
  columns: [Col];
  isOneToOne: false;
  referencedRelation: Ref;
  referencedColumns: ["id"];
};

export type Database = {
  __InternalSupabase: { PostgrestVersion: "12" };
  public: {
    Tables: {
      profiles: Table<ProfileRow, Optional<ProfileRow, "full_name" | "phone" | "created_at" | "updated_at">>;
      organizations: Table<
        OrganizationRow,
        Optional<
          OrganizationRow,
          | "id"
          | "legal_name"
          | "nit"
          | "phone"
          | "address"
          | "city"
          | "bank_name"
          | "bank_account_name"
          | "bank_account_number"
          | "bank_qr_path"
          | "reminder_templates"
          | "created_at"
          | "updated_at"
        >
      >;
      organization_members: Table<
        OrganizationMemberRow,
        Optional<OrganizationMemberRow, "id" | "role" | "created_at">,
        [Rel<"organization_members_organization_id_fkey", "organization_id", "organizations">]
      >;
      customers: Table<
        CustomerRow,
        Optional<
          CustomerRow,
          "id" | "business_name" | "nit" | "email" | "address" | "city" | "notes" | "status" | "created_at" | "updated_at"
        >
      >;
      invoices: Table<
        InvoiceRow,
        Optional<InvoiceRow, "id" | "description" | "outstanding_amount" | "status" | "notes" | "created_at" | "updated_at">,
        [Rel<"invoices_customer_id_organization_id_fkey", "customer_id", "customers">]
      >;
      payments: Table<
        PaymentRow,
        Optional<
          PaymentRow,
          | "id"
          | "invoice_id"
          | "payment_date"
          | "payment_method"
          | "reference"
          | "proof_path"
          | "status"
          | "notes"
          | "submitted_by_customer"
          | "verified_at"
          | "verified_by"
          | "created_at"
          | "updated_at"
        >,
        [
          Rel<"payments_customer_id_organization_id_fkey", "customer_id", "customers">,
          Rel<"payments_invoice_id_organization_id_fkey", "invoice_id", "invoices">,
        ]
      >;
      collection_events: Table<
        CollectionEventRow,
        Optional<CollectionEventRow, "id" | "invoice_id" | "message" | "created_by" | "created_at">,
        [
          Rel<"collection_events_customer_id_organization_id_fkey", "customer_id", "customers">,
          Rel<"collection_events_invoice_id_organization_id_fkey", "invoice_id", "invoices">,
        ]
      >;
      public_payment_links: Table<
        PublicPaymentLinkRow,
        Optional<PublicPaymentLinkRow, "id" | "token" | "active" | "expires_at" | "created_at">
      >;
    };
    Views: {
      invoice_overview: { Row: InvoiceOverviewRow; Relationships: [] };
      customer_overview: { Row: CustomerOverviewRow; Relationships: [] };
    };
    Functions: {
      record_payment: {
        Args: {
          p_invoice_id: string;
          p_amount: number;
          p_payment_date: string;
          p_method: PaymentMethod;
          p_reference?: string | null;
          p_notes?: string | null;
        };
        Returns: Json;
      };
      verify_payment: { Args: { p_payment_id: string }; Returns: Json };
      reject_payment: { Args: { p_payment_id: string; p_reason?: string | null }; Returns: Json };
      get_or_create_payment_link: { Args: { p_invoice_id: string }; Returns: string };
      get_payment_page: { Args: { p_token: string }; Returns: Json };
      submit_payment_proof: {
        Args: {
          p_token: string;
          p_amount: number;
          p_proof_path: string;
          p_reference?: string | null;
          p_note?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      member_role: MemberRole;
      customer_status: CustomerStatus;
      invoice_status: InvoiceStatus;
      payment_method: PaymentMethod;
      payment_status: PaymentStatus;
      collection_event_type: CollectionEventType;
    };
    CompositeTypes: Record<string, never>;
  };
};
