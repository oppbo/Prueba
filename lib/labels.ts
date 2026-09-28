import type {
  CollectionEventType,
  CustomerStatus,
  InvoiceStatus,
  MemberRole,
  PaymentMethod,
  PaymentStatus,
} from "@/types/database";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand";

export const INVOICE_STATUS: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendiente", tone: "info" },
  partially_paid: { label: "Pago parcial", tone: "warning" },
  paid: { label: "Pagada", tone: "success" },
  overdue: { label: "Vencida", tone: "danger" },
  cancelled: { label: "Anulada", tone: "neutral" },
};

export const PAYMENT_STATUS: Record<PaymentStatus, { label: string; tone: Tone }> = {
  pending_verification: { label: "Por verificar", tone: "warning" },
  verified: { label: "Verificado", tone: "success" },
  rejected: { label: "Rechazado", tone: "danger" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  bank_transfer: "Transferencia",
  qr: "QR bancario",
  cash: "Efectivo",
  other: "Otro",
};

export const CUSTOMER_STATUS: Record<CustomerStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  inactive: { label: "Inactivo", tone: "neutral" },
};

export const MEMBER_ROLE: Record<MemberRole, string> = {
  owner: "Propietario",
  admin: "Administrador",
  collector: "Cobrador",
};

export const EVENT_LABEL: Record<CollectionEventType, string> = {
  reminder_created: "Recordatorio preparado",
  whatsapp_opened: "WhatsApp abierto",
  note_added: "Nota agregada",
  payment_proof_received: "Comprobante recibido",
  payment_verified: "Pago verificado",
  payment_rejected: "Comprobante rechazado",
  invoice_created: "Factura creada",
  invoice_updated: "Factura actualizada",
};
