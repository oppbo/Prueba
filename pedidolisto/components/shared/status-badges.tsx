import { Badge } from "@/components/ui/badge";
import { ORDER_STATUS, PAYMENT_TYPE, STOCK_STATUS, CUSTOMER_STATUS } from "@/lib/labels";
import type { CustomerStatus, OrderStatus, PaymentType, StockStatus } from "@/lib/types";

export function OrderStatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const s = ORDER_STATUS[status];
  return (
    <Badge tone={s.tone} dot className={className}>
      {s.label}
    </Badge>
  );
}

export function PaymentTypeBadge({ type, className }: { type: PaymentType; className?: string }) {
  const s = PAYMENT_TYPE[type];
  return (
    <Badge tone={s.tone} className={className}>
      {s.label}
    </Badge>
  );
}

export function StockBadge({ status }: { status: StockStatus }) {
  const s = STOCK_STATUS[status];
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
