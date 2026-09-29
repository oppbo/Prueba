"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ClipboardList, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterChips } from "@/components/shared/filter-chips";
import { EmptyState } from "@/components/shared/empty-state";
import { Pagination, paginate } from "@/components/shared/pagination";
import { OrdersTable } from "@/components/orders/orders-table";
import { addDays, formatMoney, formatNumber, isToday, startOfDay } from "@/lib/format";
import { useCurrentUser, useData, useLookups } from "@/lib/store/hooks";
import type { Order } from "@/lib/types";
import { normalizeText } from "@/lib/utils";

type StatusFilter = "all" | "pending" | "preparing" | "dispatched" | "delivered" | "cancelled";
type Period = "today" | "yesterday" | "7d" | "all";

const STATUS_GROUPS: Record<StatusFilter, Order["status"][] | null> = {
  all: null,
  pending: ["pending", "confirmed"],
  preparing: ["preparing", "ready"],
  dispatched: ["dispatched"],
  delivered: ["delivered"],
  cancelled: ["cancelled"],
};

const PAGE_SIZE = 20;

function inPeriod(order: Order, period: Period): boolean {
  if (period === "all") return true;
  if (period === "today") return isToday(order.createdAt);
  const created = new Date(order.createdAt);
  if (period === "yesterday") {
    const y = startOfDay(addDays(new Date(), -1));
    return created >= y && created < startOfDay();
  }
  return created >= startOfDay(addDays(new Date(), -6));
}

export default function OrdersPage() {
  const data = useData();
  const lookups = useLookups();
  const user = useCurrentUser();
  const params = useSearchParams();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<StatusFilter>((params.get("estado") as StatusFilter) ?? "all");
  const [period, setPeriod] = useState<Period>("today");
  const [seller, setSeller] = useState(user.salespersonId ?? "");
  const [page, setPage] = useState(1);

  const base = useMemo(() => {
    const q = normalizeText(query.trim());
    return data.orders
      .filter((o) => inPeriod(o, period))
      .filter((o) => !seller || o.salespersonId === seller)
      .filter((o) => {
        if (!q) return true;
        const c = lookups.customer.get(o.customerId);
        return normalizeText(`${o.number} ${c?.businessName ?? ""} ${c?.zone ?? ""}`).includes(q);
      })
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [data.orders, period, seller, query, lookups]);

  const counts = useMemo(() => {
    const result = {} as Record<StatusFilter, number>;
    (Object.keys(STATUS_GROUPS) as StatusFilter[]).forEach((k) => {
      const group = STATUS_GROUPS[k];
      result[k] = group ? base.filter((o) => group.includes(o.status)).length : base.length;
    });
    return result;
  }, [base]);

  const filtered = useMemo(() => {
    const group = STATUS_GROUPS[status];
    return group ? base.filter((o) => group.includes(o.status)) : base;
  }, [base, status]);

  const total = filtered.filter((o) => o.status !== "cancelled").reduce((a, o) => a + o.total, 0);
  const reset = <T,>(fn: (v: T) => void) => (v: T) => {
    fn(v);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title={user.role === "seller" ? "Mis pedidos" : "Pedidos"}
        description="Todos los pedidos de vendedores, WhatsApp y teléfono en un solo lugar."
        actions={
          user.role !== "warehouse" && (
            <Button asChild>
              <Link href="/pedidos/nuevo">
                <Plus /> Nuevo pedido
              </Link>
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <SearchInput value={query} onChange={reset(setQuery)} placeholder="Buscar por número, cliente o zona..." className="lg:max-w-sm lg:flex-1" />
        <div className="grid grid-cols-2 gap-2 sm:flex">
          <NativeSelect value={period} onChange={(e) => reset(setPeriod)(e.target.value as Period)} aria-label="Periodo" className="sm:w-36">
            <option value="today">Hoy</option>
            <option value="yesterday">Ayer</option>
            <option value="7d">Últimos 7 días</option>
            <option value="all">Todos</option>
          </NativeSelect>
          {user.role !== "seller" && (
            <NativeSelect value={seller} onChange={(e) => reset(setSeller)(e.target.value)} aria-label="Vendedor" className="sm:w-48">
              <option value="">Todos los vendedores</option>
              {data.salespeople.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </NativeSelect>
          )}
        </div>
      </div>

      <FilterChips
        value={status}
        onChange={reset(setStatus)}
        options={[
          { value: "all", label: "Todos", count: counts.all },
          { value: "pending", label: "Pendientes", count: counts.pending },
          { value: "preparing", label: "Preparando", count: counts.preparing },
          { value: "dispatched", label: "Despachados", count: counts.dispatched },
          { value: "delivered", label: "Entregados", count: counts.delivered },
          { value: "cancelled", label: "Cancelados", count: counts.cancelled },
        ]}
      />

      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 text-sm sm:px-5">
          <span className="text-muted-foreground">
            <span className="font-medium text-foreground tabular">{formatNumber(filtered.length)}</span> pedidos
          </span>
          <span className="text-muted-foreground">
            Total <span className="font-semibold text-foreground tabular">{formatMoney(total, { decimals: 0 })}</span>
          </span>
        </div>
        {filtered.length ? (
          <>
            <OrdersTable orders={paginate(filtered, page, PAGE_SIZE)} showItems showSeller={user.role !== "seller"} compactTime={period === "today"} />
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        ) : (
          <EmptyState
            icon={ClipboardList}
            title="No hay pedidos con estos filtros"
            description="Prueba con otro periodo o estado."
            action={
              <Button variant="secondary" onClick={() => { setQuery(""); setStatus("all"); setPeriod("all"); }}>
                Ver todos los pedidos
              </Button>
            }
          />
        )}
      </Card>
    </div>
  );
}
