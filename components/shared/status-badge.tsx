import { Badge } from "@/components/ui/badge";
import { CUSTOMER_STATUS, INVOICE_STATUS, PAYMENT_STATUS } from "@/lib/labels";
import type { CustomerStatus, InvoiceStatus, PaymentStatus } from "@/types/database";

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const s = INVOICE_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function PaymentStatusBadge({ status }: { status: PaymentStatus }) {
  const s = PAYMENT_STATUS[status];
  return (
    <Badge tone={s.tone} dot>
      {s.label}
    </Badge>
  );
}

export function CustomerStatusBadge({ status }: { status: CustomerStatus }) {
  const s = CUSTOMER_STATUS[status];
  return <Badge tone={s.tone}>{s.label}</Badge>;
}

export function OverdueBadge({ days }: { days: number }) {
  if (days <= 0) return <span className="text-muted-foreground">—</span>;
  const tone = days > 30 ? "danger" : days > 7 ? "warning" : "warning";
  return (
    <Badge tone={tone} className="tabular">
      {days} {days === 1 ? "día" : "días"}
    </Badge>
  );
}
