"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Banknote, ChevronRight, ClipboardList, CreditCard, MessageSquareText, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { OrdersTable } from "@/components/orders/orders-table";
import { formatFullDate, formatMoney, formatNumber, greeting } from "@/lib/format";
import { useAccounts, useCurrentUser, useData } from "@/lib/store/hooks";
import { firstName } from "@/lib/utils";
import { useDashboardStats } from "./use-dashboard-stats";

export function SellerDashboard() {
  const user = useCurrentUser();
  const data = useData();
  const accounts = useAccounts();
  const s = useDashboardStats(user.salespersonId);
  const seller = data.salespeople.find((p) => p.id === user.salespersonId);
  const progress = seller ? Math.min(100, Math.round((s.today.sales / seller.dailyTarget) * 100)) : 0;

  const toCollect = useMemo(
    () =>
      data.customers
        .filter((c) => c.salespersonId === user.salespersonId)
        .map((c) => ({ customer: c, account: accounts.get(c.id)! }))
        .filter((r) => r.account.overdueDebt > 0)
        .sort((a, b) => b.account.overdueDebt - a.account.overdueDebt)
        .slice(0, 6),
    [data.customers, accounts, user.salespersonId],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<p className="text-xs font-medium text-muted-foreground first-letter:uppercase">{formatFullDate(new Date())}</p>}
        title={`${greeting()}, ${firstName(user.name)}`}
        description={`Tu ruta de hoy: ${seller?.zones.join(", ")}.`}
      />

      <div className="grid gap-2 sm:grid-cols-2">
        <Button asChild size="xl" className="h-14">
          <Link href="/pedidos/nuevo">
            <Plus /> Nuevo pedido
          </Link>
        </Button>
        <Button asChild size="xl" variant="secondary" className="h-14">
          <Link href="/asistente-pedidos">
            <MessageSquareText className="text-primary" /> Pedido desde WhatsApp
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Mis ventas hoy" value={formatMoney(s.today.sales, { decimals: 0 })} icon={TrendingUp} hint={`${progress}% de la meta`} />
        <KpiCard label="Pedidos" value={formatNumber(s.today.orders)} icon={ClipboardList} change={s.changes.orders} changeLabel={s.comparisonLabel} />
        <KpiCard label="Cobrado" value={formatMoney(s.today.collected, { decimals: 0 })} icon={Banknote} />
        <KpiCard label="A crédito" value={formatMoney(s.today.credit, { decimals: 0 })} icon={CreditCard} />
      </div>

      {seller && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Meta del día</span>
            <span className="text-muted-foreground tabular">
              {formatMoney(s.today.sales, { decimals: 0 })} de {formatMoney(seller.dailyTarget)}
            </span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard title="Mis pedidos de hoy" href="/pedidos" className="lg:col-span-3">
          <div className="border-t border-border">
            {s.todayOrders.length ? (
              <OrdersTable orders={[...s.todayOrders].reverse().slice(0, 8)} showSeller={false} compactTime />
            ) : (
              <EmptyState icon={ClipboardList} title="Aún no registraste pedidos hoy" />
            )}
          </div>
        </SectionCard>
        <SectionCard title="Clientes por cobrar" description="Con deuda vencida en tu ruta" className="lg:col-span-2">
          <ul className="divide-y divide-border border-t border-border">
            {toCollect.map(({ customer, account }) => (
              <li key={customer.id}>
                <Link href={`/clientes/${customer.id}`} className="flex items-center gap-3 px-5 py-3 transition-colors hover:bg-muted/50">
                  <Avatar name={customer.businessName} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{customer.businessName}</p>
                    <p className="text-xs text-muted-foreground">{customer.zone}</p>
                  </div>
                  <span className="text-sm font-semibold text-destructive tabular">{formatMoney(account.overdueDebt)}</span>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
            {toCollect.length === 0 && <EmptyState icon={Banknote} title="Ningún cliente con deuda vencida" />}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
