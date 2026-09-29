"use client";

import { useMemo, useState } from "react";
import { History, PackageSearch } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SearchInput } from "@/components/shared/search-input";
import { FilterChips } from "@/components/shared/filter-chips";
import { ProductThumb } from "@/components/shared/product-thumb";
import { EmptyState } from "@/components/shared/empty-state";
import { priceFor } from "@/lib/domain/pricing";
import { stockStatus } from "@/lib/domain/inventory";
import { formatMoney } from "@/lib/format";
import { useData } from "@/lib/store/hooks";
import type { Customer, ID, ProductCategory } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";
import { QuantityStepper } from "./quantity-stepper";

const CATEGORIES: ProductCategory[] = ["Bebidas", "Alimentos", "Lácteos", "Limpieza", "Hogar"];

export function ProductsStep({
  customer,
  quantities,
  onQuantity,
  onRepeatLast,
  canRepeat,
}: {
  customer: Customer;
  quantities: Record<ID, number>;
  onQuantity: (productId: ID, quantity: number) => void;
  onRepeatLast: () => void;
  canRepeat: boolean;
}) {
  const data = useData();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<ProductCategory | "all">("all");

  const products = useMemo(() => {
    const q = normalizeText(query.trim());
    return data.products
      .filter((p) => p.status === "active")
      .filter((p) => category === "all" || p.category === category)
      .filter((p) => !q || normalizeText(`${p.name} ${p.brand} ${p.sku}`).includes(q));
  }, [data.products, query, category]);

  const grouped = CATEGORIES.map((c) => ({ category: c, items: products.filter((p) => p.category === c) })).filter((g) => g.items.length);

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <SearchInput value={query} onChange={setQuery} placeholder="Buscar producto..." className="flex-1" size="lg" />
        {canRepeat && (
          <Button variant="secondary" className="h-12 shrink-0" onClick={onRepeatLast} title="Cargar los productos del último pedido">
            <History /> <span className="hidden sm:inline">Repetir último</span>
          </Button>
        )}
      </div>
      <FilterChips
        value={category}
        onChange={setCategory}
        options={[{ value: "all", label: "Todos" }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]}
      />
      {grouped.length === 0 && <EmptyState icon={PackageSearch} title="Sin productos" description="Prueba con otra búsqueda." />}
      {grouped.map((group) => (
        <section key={group.category}>
          <h3 className="sticky top-14 z-10 -mx-1 bg-background/95 px-1 py-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase backdrop-blur">
            {group.category}
          </h3>
          <ul className="overflow-hidden rounded-xl border border-border bg-card">
            {group.items.map((p) => {
              const qty = quantities[p.id] ?? 0;
              const status = stockStatus(p);
              const price = priceFor(p, customer.priceList);
              return (
                <li key={p.id} className={cn("flex items-center gap-3 border-b border-border px-3 py-3 last:border-0 sm:px-4", qty > 0 && "bg-primary-soft/40")}>
                  <button type="button" className="flex min-w-0 flex-1 items-center gap-3 text-left" onClick={() => onQuantity(p.id, qty + 1)} disabled={status === "out"}>
                    <ProductThumb product={p} className="size-10" />
                    <span className="min-w-0">
                      <span className="line-clamp-2 block text-[15px] leading-snug font-medium">{p.name}</span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs">
                        <span className="font-semibold text-foreground tabular">{formatMoney(price)}</span>
                        <span className="text-muted-foreground">{p.unit}</span>
                        <span
                          className={cn(
                            "tabular",
                            status === "out" ? "font-medium text-destructive" : status === "low" ? "text-warning" : "text-muted-foreground",
                          )}
                        >
                          {status === "out" ? "Sin stock" : `Stock ${p.stock}`}
                        </span>
                      </span>
                      {qty > p.stock && status !== "out" && <span className="mt-0.5 block text-xs text-destructive">Supera el stock disponible</span>}
                    </span>
                  </button>
                  {status === "out" && qty === 0 ? (
                    <span className="shrink-0 rounded-md bg-muted px-2.5 py-1.5 text-xs font-medium text-muted-foreground">Agotado</span>
                  ) : (
                    <QuantityStepper value={qty} onChange={(v) => onQuantity(p.id, v)} className="shrink-0" />
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
