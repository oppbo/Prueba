"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, Boxes, PackageSearch, PackageX, SlidersHorizontal, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { FilterChips } from "@/components/shared/filter-chips";
import { EmptyState } from "@/components/shared/empty-state";
import { ProductThumb } from "@/components/shared/product-thumb";
import { StockBadge } from "@/components/shared/status-badges";
import { AdjustInventoryDialog } from "@/components/inventory/adjust-dialog";
import { inventoryValue, stockStatus } from "@/lib/domain/inventory";
import { MOVEMENT_TYPE } from "@/lib/labels";
import { formatDateTime, formatMoney, formatNumber } from "@/lib/format";
import { useData, useLookups, useRole } from "@/lib/store/hooks";
import type { Product, ProductCategory, StockStatus } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

type Filter = "all" | StockStatus;
const CATEGORIES: ProductCategory[] = ["Bebidas", "Alimentos", "Lácteos", "Limpieza", "Hogar"];

function StockBar({ product }: { product: Product }) {
  const status = stockStatus(product);
  const pct = Math.min(100, (product.stock / Math.max(product.minimumStock * 2.5, 1)) * 100);
  return (
    <div className="flex items-center justify-end gap-2.5">
      <div className="hidden h-1.5 w-16 overflow-hidden rounded-full bg-muted xl:block">
        <div className={cn("h-full rounded-full", status === "out" ? "bg-destructive" : status === "low" ? "bg-warning" : "bg-success")} style={{ width: `${pct}%` }} />
      </div>
      <span className={cn("w-10 text-right font-semibold tabular", status === "out" && "text-destructive", status === "low" && "text-warning")}>{formatNumber(product.stock)}</span>
    </div>
  );
}

export default function InventoryPage() {
  const data = useData();
  const lookups = useLookups();
  const role = useRole();
  const params = useSearchParams();
  const initialFilter: Filter = params.get("filtro") === "bajo" ? "low" : params.get("filtro") === "sin-stock" ? "out" : "all";
  const [filter, setFilter] = useState<Filter>(initialFilter);
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [category, setCategory] = useState<ProductCategory | "">("");
  const [adjusting, setAdjusting] = useState<string | null>(null);
  const canAdjust = role !== "seller";

  const low = data.products.filter((p) => stockStatus(p) === "low");
  const out = data.products.filter((p) => stockStatus(p) === "out");

  const rows = useMemo(() => {
    const q = normalizeText(query.trim());
    return data.products
      .filter((p) => !category || p.category === category)
      .filter((p) => !q || normalizeText(`${p.name} ${p.sku} ${p.brand}`).includes(q));
  }, [data.products, query, category]);
  const count = (f: Filter) => (f === "all" ? rows.length : rows.filter((p) => stockStatus(p) === f).length);
  const visible = filter === "all" ? rows : rows.filter((p) => stockStatus(p) === filter);

  return (
    <div className="space-y-6">
      <PageHeader
        title={role === "seller" ? "Productos" : "Inventario"}
        description="Stock disponible, alertas de reposición y movimientos."
        actions={
          canAdjust && (
            <Button onClick={() => setAdjusting("")}>
              <SlidersHorizontal /> Ajustar inventario
            </Button>
          )
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Productos" value={formatNumber(data.products.length)} icon={Boxes} hint={`${CATEGORIES.length} categorías`} />
        <KpiCard label="Stock bajo" value={formatNumber(low.length)} icon={AlertTriangle} tone="warning" hint="En o bajo el mínimo" />
        <KpiCard label="Sin stock" value={formatNumber(out.length)} icon={PackageX} tone="danger" hint="No disponibles para vender" />
        <KpiCard label="Valor estimado de inventario" value={formatMoney(inventoryValue(data.products), { decimals: 0 })} icon={Wallet} hint="A precio de costo" />
      </div>

      {(low.length > 0 || out.length > 0) && (
        <div className="flex flex-col gap-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground sm:flex-row sm:items-center">
          <AlertTriangle className="size-4 shrink-0" />
          <p className="flex-1">
            <strong>{low.length + out.length} productos necesitan reposición:</strong>{" "}
            {[...out, ...low]
              .slice(0, 4)
              .map((p) => p.shortName)
              .join(", ")}
            {low.length + out.length > 4 ? "…" : "."}
          </p>
          {filter !== "low" && (
            <Button size="sm" variant="secondary" onClick={() => setFilter("low")}>
              Ver stock bajo
            </Button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar por producto, marca o SKU..." className="sm:max-w-md sm:flex-1" />
        <NativeSelect value={category} onChange={(e) => setCategory(e.target.value as ProductCategory | "")} className="sm:w-48" aria-label="Categoría">
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </NativeSelect>
      </div>
      <FilterChips
        value={filter}
        onChange={setFilter}
        options={[
          { value: "all", label: "Todos", count: count("all") },
          { value: "normal", label: "Normal", count: count("normal") },
          { value: "low", label: "Stock bajo", count: count("low") },
          { value: "out", label: "Sin stock", count: count("out") },
        ]}
      />

      <Card className="overflow-hidden">
        {visible.length === 0 ? (
          <EmptyState icon={PackageSearch} title="Sin productos para mostrar" description="Cambia los filtros o la búsqueda." />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Producto</TH>
                    <TH className="hidden lg:table-cell">SKU</TH>
                    <TH className="hidden lg:table-cell">Categoría</TH>
                    <TH className="text-right">Stock</TH>
                    <TH className="text-right">Mínimo</TH>
                    <TH className="text-right">Precio</TH>
                    <TH>Estado</TH>
                    {canAdjust && <TH className="w-px" />}
                  </tr>
                </THead>
                <TBody>
                  {visible.map((p) => (
                    <TR key={p.id} className={cn(stockStatus(p) === "out" && "bg-destructive-soft/30")}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} />
                          <div className="min-w-0">
                            <p className="truncate font-medium">{p.name}</p>
                            <p className="text-xs text-muted-foreground">{p.unit}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="hidden font-mono text-xs text-muted-foreground lg:table-cell">{p.sku}</TD>
                      <TD className="hidden text-muted-foreground lg:table-cell">{p.category}</TD>
                      <TD className="text-right">
                        <StockBar product={p} />
                      </TD>
                      <TD className="text-right text-muted-foreground tabular">{p.minimumStock}</TD>
                      <TD className="text-right whitespace-nowrap">
                        <p className="font-medium tabular">{formatMoney(p.wholesalePrice)}</p>
                        <p className="text-xs text-muted-foreground tabular">Base {formatMoney(p.basePrice)}</p>
                      </TD>
                      <TD>
                        <StockBadge status={stockStatus(p)} />
                      </TD>
                      {canAdjust && (
                        <TD>
                          <Button size="sm" variant="ghost" onClick={() => setAdjusting(p.id)}>
                            Ajustar
                          </Button>
                        </TD>
                      )}
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {visible.map((p) => {
                const status = stockStatus(p);
                return (
                  <li key={p.id} className="flex items-center gap-3 px-4 py-3">
                    <ProductThumb product={p} className="size-10" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground tabular">
                        {formatMoney(p.wholesalePrice)} · mín. {p.minimumStock}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-base font-semibold tabular", status === "out" && "text-destructive", status === "low" && "text-warning")}>{p.stock}</p>
                      <StockBadge status={status} />
                    </div>
                    {canAdjust && (
                      <Button size="icon-sm" variant="ghost" onClick={() => setAdjusting(p.id)} aria-label={`Ajustar ${p.name}`}>
                        <SlidersHorizontal />
                      </Button>
                    )}
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </Card>

      {canAdjust && (
        <Card>
          <CardHeader>
            <CardTitle>Últimos movimientos</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {data.inventoryMovements.slice(0, 8).map((m) => {
                const product = lookups.product.get(m.productId);
                return (
                  <li key={m.id} className="flex items-center gap-3 py-2.5 text-sm">
                    <span
                      className={cn(
                        "w-20 shrink-0 rounded-md px-2 py-0.5 text-center text-xs font-medium",
                        m.quantity >= 0 ? "bg-success-soft text-success-soft-foreground" : "bg-muted text-muted-foreground",
                      )}
                    >
                      {MOVEMENT_TYPE[m.type]}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-medium">{product?.name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {m.reason} · {formatDateTime(m.date)}
                      </span>
                    </span>
                    <span className={cn("shrink-0 font-semibold tabular", m.quantity >= 0 ? "text-success" : "text-foreground")}>
                      {m.quantity > 0 ? "+" : ""}
                      {m.quantity}
                    </span>
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      <AdjustInventoryDialog productId={adjusting} onClose={() => setAdjusting(null)} />
    </div>
  );
}
