"use client";

import Link from "next/link";
import { AlertTriangle, Banknote, ClipboardList, CreditCard, MessageSquareText, Plus, Receipt, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";
import { KpiCard } from "@/components/shared/kpi-card";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { ProductThumb } from "@/components/shared/product-thumb";
import { Avatar } from "@/components/shared/avatar";
import { SalesBarChart } from "@/components/charts/sales-bar-chart";
import { BarList } from "@/components/charts/bar-list";
import { OrdersTable } from "@/components/orders/orders-table";
import { formatFullDate, formatMoney, formatNumber, greeting } from "@/lib/format";
import { useData, useLookups } from "@/lib/store/hooks";
import { AlertsCard, type AlertItem } from "./alerts-card";
import { useDashboardStats } from "./use-dashboard-stats";

export function OwnerDashboard() {
  const data = useData();
  const lookups = useLookups();
  const s = useDashboardStats();
  const weekTotal = s.series.reduce((a, p) => a + p.sales, 0);

  const alerts: AlertItem[] = [
    { key: "stock", icon: "stock", tone: "warning", title: `${s.lowStock} productos tienen stock bajo`, description: s.outOfStock ? `Y ${s.outOfStock} sin stock · programa la reposición` : "Programa la reposición con tus proveedores", href: "/inventario?filtro=bajo" },
    { key: "debt", icon: "debt", tone: "danger", title: `${s.overdueCustomers} clientes tienen deuda vencida`, description: `${formatMoney(s.overdueAmount, { decimals: 0 })} vencidos en total`, href: "/cobranzas?filtro=vencido" },
    { key: "orders", icon: "orders", tone: "info", title: `${s.notPrepared} pedidos todavía no fueron preparados`, description: s.pendingOrders ? `${s.pendingOrders} esperan confirmación` : "Confirmados, esperando a almacén", href: "/almacen" },
    { key: "due", icon: "due", tone: "warning", title: `${formatMoney(s.dueThisWeek, { decimals: 0 })} pendientes de cobro esta semana`, description: "Créditos que vencen en los próximos 7 días", href: "/cobranzas?filtro=semana" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow={<p className="text-xs font-medium text-muted-foreground first-letter:uppercase">{formatFullDate(new Date())}</p>}
        title={`${greeting()}, ${data.company.ownerName}`}
        description={`Esto es lo que está pasando hoy en ${data.company.name}.`}
        actions={
          <>
            <Button asChild variant="secondary" className="hidden sm:inline-flex">
              <Link href="/asistente-pedidos">
                <MessageSquareText /> Asistente de pedidos
              </Link>
            </Button>
            <Button asChild className="hidden sm:inline-flex">
              <Link href="/pedidos/nuevo">
                <Plus /> Nuevo pedido
              </Link>
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
        <KpiCard label="Ventas de hoy" value={formatMoney(s.today.sales, { decimals: 0 })} icon={TrendingUp} change={s.changes.sales} changeLabel={s.comparisonLabel} href="/reportes" />
        <KpiCard label="Cobrado hoy" value={formatMoney(s.today.collected, { decimals: 0 })} icon={Banknote} change={s.changes.collected} changeLabel={s.comparisonLabel} href="/cobranzas" />
        <KpiCard label="Ventas a crédito" value={formatMoney(s.today.credit, { decimals: 0 })} icon={CreditCard} hint={`${Math.round((s.today.credit / Math.max(s.today.sales, 1)) * 100)}% de las ventas`} href="/cobranzas" />
        <KpiCard label="Pedidos" value={formatNumber(s.today.orders)} icon={ClipboardList} change={s.changes.orders} changeLabel={s.comparisonLabel} href="/pedidos" />
        <KpiCard label="Ticket promedio" value={formatMoney(s.today.avgTicket, { decimals: 0 })} icon={Receipt} change={s.changes.avgTicket} changeLabel={s.comparisonLabel} />
        <KpiCard
          label="Clientes con deuda vencida"
          value={formatNumber(s.overdueCustomers)}
          icon={AlertTriangle}
          tone="danger"
          hint={`${formatMoney(s.overdueAmount, { decimals: 0 })} vencido`}
          href="/cobranzas?filtro=vencido"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <SectionCard title="Ventas de los últimos 7 días" description={`${formatMoney(weekTotal, { decimals: 0 })} en total`} href="/reportes" hrefLabel="Reportes" className="lg:col-span-2">
          <CardContent>
            <SalesBarChart data={s.series} />
          </CardContent>
        </SectionCard>
        <AlertsCard alerts={alerts} />
      </div>

      <SectionCard title="Pedidos recientes" description="Se actualiza con cada pedido de vendedores y WhatsApp" href="/pedidos">
        <div className="border-t border-border">
          <OrdersTable orders={s.recentOrders} compactTime />
        </div>
      </SectionCard>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Productos más vendidos" description="Hoy, por monto vendido" href="/reportes">
          <CardContent>
            <BarList
              items={s.topProducts.map((t) => {
                const p = lookups.product.get(t.productId)!;
                return {
                  key: t.productId,
                  label: p.name,
                  value: t.revenue,
                  display: formatMoney(t.revenue, { decimals: 0 }),
                  secondary: `${formatNumber(t.units)} u.`,
                  leading: <ProductThumb product={p} />,
                };
              })}
            />
          </CardContent>
        </SectionCard>
        <SectionCard title="Ventas por vendedor" description="Hoy" href="/vendedores">
          <CardContent>
            <BarList
              items={[...s.sellers]
                .sort((a, b) => b.sales - a.sales)
                .map((row) => {
                  const seller = lookups.salesperson.get(row.salespersonId)!;
                  return {
                    key: row.salespersonId,
                    label: seller.name,
                    value: row.sales,
                    display: formatMoney(row.sales, { decimals: 0 }),
                    secondary: `${row.orders} pedidos`,
                    leading: <Avatar name={seller.name} color={seller.color} />,
                    href: "/vendedores",
                  };
                })}
            />
          </CardContent>
        </SectionCard>
      </div>
    </div>
  );
}
