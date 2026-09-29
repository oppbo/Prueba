"use client";

import { useMemo } from "react";
import { Sparkles } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductThumb } from "@/components/shared/product-thumb";
import { ORDER_CHANNEL } from "@/lib/labels";
import { daysBetween, formatDate, formatMoney } from "@/lib/format";
import { useData, useLookups } from "@/lib/store/hooks";
import type { ID, OrderChannel } from "@/lib/types";

export function useCustomerInsights(customerId: ID) {
  const data = useData();
  const lookups = useLookups();
  return useMemo(() => {
    const orders = data.orders
      .filter((o) => o.customerId === customerId && o.status !== "cancelled")
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const average = orders.length ? orders.reduce((a, o) => a + o.total, 0) / orders.length : 0;
    let frequency: number | null = null;
    if (orders.length >= 2) {
      const span = daysBetween(orders[0].createdAt, orders[orders.length - 1].createdAt);
      frequency = Math.max(1, Math.round(span / (orders.length - 1)));
    }
    const units = new Map<ID, number>();
    const channels = new Map<OrderChannel, number>();
    for (const o of orders) {
      channels.set(o.channel, (channels.get(o.channel) ?? 0) + 1);
      for (const i of o.items) units.set(i.productId, (units.get(i.productId) ?? 0) + i.quantity);
    }
    const top = [...units.entries()].sort((a, b) => b[1] - a[1])[0];
    const channel = [...channels.entries()].sort((a, b) => b[1] - a[1])[0]?.[0];
    return {
      orders: orders.length,
      average,
      frequency,
      topProduct: top ? lookups.product.get(top[0]) : undefined,
      topUnits: top?.[1] ?? 0,
      channel,
      since: lookups.customer.get(customerId)?.createdAt,
    };
  }, [data.orders, customerId, lookups]);
}

export function CustomerSummary({ customerId }: { customerId: ID }) {
  const s = useCustomerInsights(customerId);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Resumen del cliente
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Compra promedio</p>
            <p className="mt-1 text-lg font-semibold tabular">{s.orders ? formatMoney(s.average, { decimals: 0 }) : "—"}</p>
          </div>
          <div className="rounded-lg bg-muted/60 p-3">
            <p className="text-xs text-muted-foreground">Frecuencia</p>
            <p className="mt-1 text-lg font-semibold">{s.frequency ? `Cada ${s.frequency} ${s.frequency === 1 ? "día" : "días"}` : "—"}</p>
          </div>
        </div>
        {s.topProduct && (
          <div>
            <p className="text-xs text-muted-foreground">Producto más comprado</p>
            <div className="mt-1.5 flex items-center gap-3">
              <ProductThumb product={s.topProduct} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.topProduct.name}</p>
                <p className="text-xs text-muted-foreground tabular">{s.topUnits} unidades compradas</p>
              </div>
            </div>
          </div>
        )}
        <dl className="space-y-2 border-t border-border pt-3 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Pedidos registrados</dt>
            <dd className="font-medium tabular">{s.orders}</dd>
          </div>
          {s.channel && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Canal preferido</dt>
              <dd className="font-medium">{ORDER_CHANNEL[s.channel]}</dd>
            </div>
          )}
          {s.since && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cliente desde</dt>
              <dd className="font-medium">{formatDate(s.since)}</dd>
            </div>
          )}
        </dl>
      </CardContent>
    </Card>
  );
}
