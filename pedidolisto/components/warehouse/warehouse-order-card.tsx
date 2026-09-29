"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Check, Clock, MapPin, PackageCheck, PlayCircle, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { OrderStatusBadge } from "@/components/shared/status-badges";
import { orderUnits } from "@/lib/domain/orders";
import { formatDateTime, formatTimeAgo } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useLookups } from "@/lib/store/hooks";
import type { Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

const ACTIONS: Partial<Record<OrderStatus, { label: string; next: OrderStatus; icon: typeof Check; toast: string }>> = {
  pending: { label: "Comenzar preparación", next: "preparing", icon: PlayCircle, toast: "Preparación iniciada" },
  confirmed: { label: "Comenzar preparación", next: "preparing", icon: PlayCircle, toast: "Preparación iniciada" },
  preparing: { label: "Marcar como listo", next: "ready", icon: PackageCheck, toast: "Pedido listo para despacho" },
  ready: { label: "Marcar como despachado", next: "dispatched", icon: Truck, toast: "Pedido despachado" },
  dispatched: { label: "Confirmar entrega", next: "delivered", icon: Check, toast: "Entrega confirmada" },
};

export function WarehouseOrderCard({ order }: { order: Order }) {
  const lookups = useLookups();
  const updateStatus = useDemoStore((s) => s.updateOrderStatus);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const customer = lookups.customer.get(order.customerId);
  const action = ACTIONS[order.status];
  const [mountedAt] = useState(() => Date.now());
  const isNew = mountedAt - new Date(order.createdAt).getTime() < 30 * 60_000;
  const preparing = order.status === "preparing";

  const togglePick = (id: string) =>
    setPicked((s) => {
      const next = new Set(s);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <article className={cn("flex flex-col rounded-xl border bg-card shadow-xs animate-in", isNew ? "border-primary/40 ring-2 ring-primary/10" : "border-border")}>
      <header className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Link href={`/pedidos/${order.id}`} className="text-lg font-semibold tracking-tight tabular hover:text-primary">
              {order.number}
            </Link>
            {isNew && <Badge tone="brand">Nuevo</Badge>}
          </div>
          <p className="truncate text-[15px] font-medium">{customer?.businessName}</p>
          <p className="flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="size-3.5" /> {customer?.zone}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <OrderStatusBadge status={order.status} />
          <span className="flex items-center gap-1 text-xs text-muted-foreground" title={formatDateTime(order.createdAt)}>
            <Clock className="size-3" /> {formatTimeAgo(order.createdAt)}
          </span>
        </div>
      </header>
      <ul className="flex-1 space-y-1 px-4 py-3">
        {order.items.map((item) => {
          const product = lookups.product.get(item.productId);
          const done = picked.has(item.productId);
          return (
            <li key={item.productId}>
              <button
                type="button"
                disabled={!preparing}
                onClick={() => togglePick(item.productId)}
                className={cn("flex w-full items-center gap-3 rounded-md py-1 text-left text-[15px]", preparing && "hover:bg-muted/60 px-1 -mx-1")}
              >
                {preparing && (
                  <span className={cn("grid size-5 shrink-0 place-items-center rounded border", done ? "border-success bg-success text-white" : "border-input")}>
                    {done && <Check className="size-3.5" />}
                  </span>
                )}
                <span className="w-9 shrink-0 text-right text-base font-bold tabular">{item.quantity}</span>
                <span className={cn("min-w-0 truncate", done && "text-muted-foreground line-through")}>{product?.shortName}</span>
              </button>
            </li>
          );
        })}
      </ul>
      {order.notes && <p className="mx-4 mb-3 rounded-md bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">Nota: {order.notes}</p>}
      <footer className="space-y-3 border-t border-border px-4 py-3">
        <p className="text-sm text-muted-foreground tabular">
          <span className="font-semibold text-foreground">{orderUnits(order)} unidades</span> / {order.items.length} {order.items.length === 1 ? "producto" : "productos"}
          {preparing && ` · ${picked.size}/${order.items.length} revisados`}
        </p>
        {action && (
          <Button
            size="lg"
            variant={order.status === "dispatched" ? "secondary" : "default"}
            className="w-full font-semibold tracking-wide uppercase"
            onClick={() => {
              updateStatus(order.id, action.next);
              toast.success(`${order.number} · ${action.toast}`);
            }}
          >
            <action.icon /> {action.label}
          </Button>
        )}
      </footer>
    </article>
  );
}
