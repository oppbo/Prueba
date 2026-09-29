"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, Layers, PackageOpen } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductThumb } from "@/components/shared/product-thumb";
import { WarehouseOrderCard } from "@/components/warehouse/warehouse-order-card";
import { formatFullDate, formatNumber, isToday } from "@/lib/format";
import { useData, useLookups } from "@/lib/store/hooks";
import type { ID, Order, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "pending" | "preparing" | "ready" | "dispatched" | "summary";

const TAB_STATUS: Record<Exclude<Tab, "summary">, OrderStatus[]> = {
  pending: ["pending", "confirmed"],
  preparing: ["preparing"],
  ready: ["ready"],
  dispatched: ["dispatched"],
};

const TABS: { value: Tab; label: string }[] = [
  { value: "pending", label: "Pendientes" },
  { value: "preparing", label: "Preparando" },
  { value: "ready", label: "Listos" },
  { value: "dispatched", label: "Despachados" },
  { value: "summary", label: "Consolidado del día" },
];

export default function WarehousePage() {
  const data = useData();
  const lookups = useLookups();
  const [tab, setTab] = useState<Tab>("pending");

  const byTab = useMemo(() => {
    const result = {} as Record<Exclude<Tab, "summary">, Order[]>;
    (Object.keys(TAB_STATUS) as Exclude<Tab, "summary">[]).forEach((t) => {
      result[t] = data.orders
        .filter((o) => TAB_STATUS[t].includes(o.status))
        .filter((o) => t !== "dispatched" || isToday(o.updatedAt) || isToday(o.createdAt))
        // Newest first so incoming orders appear at the top.
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
    return result;
  }, [data.orders]);

  const toPrepare = useMemo(() => [...byTab.pending, ...byTab.preparing, ...byTab.ready], [byTab]);
  const consolidated = useMemo(() => {
    const map = new Map<ID, { units: number; orders: number }>();
    for (const o of toPrepare) {
      for (const i of o.items) {
        const row = map.get(i.productId) ?? { units: 0, orders: 0 };
        row.units += i.quantity;
        row.orders += 1;
        map.set(i.productId, row);
      }
    }
    return [...map.entries()].map(([productId, v]) => ({ productId, ...v })).sort((a, b) => b.units - a.units);
  }, [toPrepare]);

  const totalUnits = consolidated.reduce((a, r) => a + r.units, 0);
  const current = tab === "summary" ? [] : byTab[tab];

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={<p className="text-xs font-medium text-muted-foreground first-letter:uppercase">{formatFullDate(new Date())}</p>}
        title="Pedidos para preparar"
        description={`${toPrepare.length} pedidos en cola · ${formatNumber(totalUnits)} unidades por preparar`}
      />

      <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:px-0" role="tablist">
        {TABS.map((t) => {
          const count = t.value === "summary" ? consolidated.length : byTab[t.value].length;
          const active = tab === t.value;
          return (
            <button
              key={t.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.value)}
              className={cn(
                "inline-flex h-11 shrink-0 items-center gap-2 rounded-lg border px-4 text-sm font-medium transition-colors",
                active ? "border-foreground bg-foreground text-background" : "border-border bg-card text-muted-foreground hover:text-foreground",
                t.value === "summary" && !active && "border-primary/30 text-primary",
              )}
            >
              {t.value === "summary" && <Layers className="size-4" />}
              {t.label}
              <span className={cn("rounded-full px-1.5 text-xs tabular", active ? "bg-background/20" : "bg-muted")}>{count}</span>
            </button>
          );
        })}
      </div>

      {tab === "summary" ? (
        <Card className="overflow-hidden">
          <div className="flex flex-col gap-1 border-b border-border px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-[15px] font-semibold">Productos necesarios hoy</h2>
              <p className="text-sm text-muted-foreground">Suma de todos los pedidos pendientes, en preparación y listos. Úsalo para cargar el camión de una vez.</p>
            </div>
            <p className="text-sm font-medium tabular">{formatNumber(totalUnits)} unidades</p>
          </div>
          {consolidated.length === 0 ? (
            <EmptyState icon={ClipboardCheck} title="No hay productos por preparar" />
          ) : (
            <Table>
              <THead>
                <tr>
                  <TH>Producto</TH>
                  <TH className="text-right">Unidades</TH>
                  <TH className="hidden text-right sm:table-cell">Pedidos</TH>
                  <TH className="text-right">Stock</TH>
                </tr>
              </THead>
              <TBody>
                {consolidated.map((r) => {
                  const p = lookups.product.get(r.productId)!;
                  return (
                    <TR key={r.productId}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.unit}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-right text-lg font-bold tabular">{formatNumber(r.units)}</TD>
                      <TD className="hidden text-right text-muted-foreground tabular sm:table-cell">{r.orders}</TD>
                      <TD className={cn("text-right tabular", p.stock < 0 ? "font-medium text-destructive" : "text-muted-foreground")}>{p.stock}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          )}
        </Card>
      ) : current.length === 0 ? (
        <Card>
          <EmptyState icon={PackageOpen} title="No hay pedidos en esta etapa" description="Cuando lleguen nuevos pedidos aparecerán aquí automáticamente." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {current.map((o) => (
            <WarehouseOrderCard key={o.id} order={o} />
          ))}
        </div>
      )}
    </div>
  );
}
