"use client";

import { useMemo, useState } from "react";
import { ClipboardList, CreditCard, Receipt, TrendingUp } from "lucide-react";
import { CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SectionCard } from "@/components/shared/section-card";
import { FilterChips } from "@/components/shared/filter-chips";
import { ProductThumb } from "@/components/shared/product-thumb";
import { BarList } from "@/components/charts/bar-list";
import { SalesBarChart } from "@/components/charts/sales-bar-chart";
import { CashCreditChart } from "@/components/charts/cash-credit-chart";
import { HourlyChart } from "@/components/charts/hourly-chart";
import { CHART_COLORS } from "@/components/charts/chart-tooltip";
import {
  coverageFactor,
  ordersInRange,
  RANGE_LABEL,
  salesByCategory,
  salesByHour,
  salesSeries,
  sellerStats,
  topProducts,
  type RangeKey,
} from "@/lib/domain/analytics";
import { formatMoney, formatNumber } from "@/lib/format";
import { useAccounts, useData, useLookups } from "@/lib/store/hooks";

const RANGES: RangeKey[] = ["today", "7d", "30d"];

export default function ReportsPage() {
  const data = useData();
  const lookups = useLookups();
  const accounts = useAccounts();
  const [range, setRange] = useState<RangeKey>("7d");

  const r = useMemo(() => {
    const orders = ordersInRange(data.orders, range);
    const k = coverageFactor(data, range);
    const series = range === "today" ? [] : salesSeries(data, range === "7d" ? 7 : 30);
    const sales = range === "today" ? orders.reduce((a, o) => a + o.total, 0) : series.reduce((a, p) => a + p.sales, 0);
    const count = range === "today" ? orders.length : series.reduce((a, p) => a + p.orders, 0);
    const credit = range === "today" ? orders.filter((o) => o.paymentType === "credit").reduce((a, o) => a + o.total, 0) : series.reduce((a, p) => a + p.credit, 0);
    return {
      series,
      hourly: range === "today" ? salesByHour(orders) : [],
      sales,
      count,
      credit,
      categories: salesByCategory(orders, (id) => lookups.product.get(id)?.category).map((c) => ({ ...c, sales: c.sales * k })),
      sellers: sellerStats(orders, [], data.salespeople.map((s) => s.id)).map((s) => ({ ...s, sales: s.sales * k, orders: Math.round(s.orders * k) })),
      products: topProducts(orders, 10).map((p) => ({ ...p, revenue: p.revenue * k, units: Math.round(p.units * k) })),
    };
  }, [data, range, lookups]);

  const overdue = useMemo(
    () =>
      data.customers
        .map((c) => ({ customer: c, account: accounts.get(c.id)! }))
        .filter((x) => x.account.overdueDebt > 0)
        .sort((a, b) => b.account.overdueDebt - a.account.overdueDebt)
        .slice(0, 6),
    [data.customers, accounts],
  );

  const cashShare = r.sales ? ((r.sales - r.credit) / r.sales) * 100 : 0;
  const categoryTotal = r.categories.reduce((a, c) => a + c.sales, 0);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reportes"
        description="Cómo va tu distribuidora: ventas, productos, vendedores y cartera."
        actions={<FilterChips value={range} onChange={setRange} options={RANGES.map((x) => ({ value: x, label: RANGE_LABEL[x] }))} className="mx-0 px-0" />}
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Ventas" value={formatMoney(r.sales, { decimals: 0 })} icon={TrendingUp} hint={RANGE_LABEL[range]} />
        <KpiCard label="Pedidos" value={formatNumber(r.count)} icon={ClipboardList} hint={range === "today" ? "Hoy" : `${formatNumber(Math.round(r.count / (range === "7d" ? 7 : 30)))} por día`} />
        <KpiCard label="Ticket promedio" value={formatMoney(r.count ? r.sales / r.count : 0, { decimals: 0 })} icon={Receipt} />
        <KpiCard label="Ventas a crédito" value={`${Math.round(100 - cashShare)}%`} icon={CreditCard} hint={formatMoney(r.credit, { decimals: 0 })} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title={range === "today" ? "Ventas por hora" : `Ventas últimos ${range === "7d" ? "7" : "30"} días`}>
          <CardContent>{range === "today" ? <HourlyChart data={r.hourly} /> : <SalesBarChart data={r.series} />}</CardContent>
        </SectionCard>
        <SectionCard title="Contado vs crédito" description={`${Math.round(cashShare)}% contado · ${Math.round(100 - cashShare)}% crédito`}>
          <CardContent>
            {range === "today" ? (
              <div className="space-y-4 pt-2">
                <div className="flex h-4 overflow-hidden rounded-full">
                  <div style={{ width: `${cashShare}%`, backgroundColor: CHART_COLORS.primary }} />
                  <div className="border-l-2 border-card" style={{ width: `${100 - cashShare}%`, backgroundColor: CHART_COLORS.credit }} />
                </div>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="size-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.primary }} /> Contado
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular">{formatMoney(r.sales - r.credit, { decimals: 0 })}</dd>
                  </div>
                  <div>
                    <dt className="flex items-center gap-1.5 text-sm text-muted-foreground">
                      <span className="size-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.credit }} /> Crédito
                    </dt>
                    <dd className="mt-1 text-xl font-semibold tabular">{formatMoney(r.credit, { decimals: 0 })}</dd>
                  </div>
                </dl>
              </div>
            ) : (
              <CashCreditChart data={r.series} height={230} />
            )}
          </CardContent>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Ventas por categoría">
          <CardContent>
            <BarList
              items={r.categories.map((c) => ({
                key: c.category,
                label: c.category,
                value: c.sales,
                display: formatMoney(c.sales, { decimals: 0 }),
                secondary: `${categoryTotal ? Math.round((c.sales / categoryTotal) * 100) : 0}%`,
              }))}
            />
          </CardContent>
        </SectionCard>
        <SectionCard title="Ventas por vendedor" href="/vendedores">
          <CardContent>
            <BarList
              items={[...r.sellers]
                .sort((a, b) => b.sales - a.sales)
                .map((s) => {
                  const sp = lookups.salesperson.get(s.salespersonId)!;
                  return { key: sp.id, label: sp.name, value: s.sales, display: formatMoney(s.sales, { decimals: 0 }), secondary: `${formatNumber(s.orders)} pedidos`, color: sp.color };
                })}
            />
          </CardContent>
        </SectionCard>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        <SectionCard title="Productos más vendidos" className="overflow-hidden lg:col-span-3">
          <Table>
            <THead>
              <tr>
                <TH>#</TH>
                <TH>Producto</TH>
                <TH className="text-right">Unidades</TH>
                <TH className="text-right">Ventas</TH>
              </tr>
            </THead>
            <TBody>
              {r.products.map((p, i) => {
                const product = lookups.product.get(p.productId)!;
                return (
                  <TR key={p.productId}>
                    <TD className="w-8 text-muted-foreground tabular">{i + 1}</TD>
                    <TD>
                      <div className="flex items-center gap-3">
                        <ProductThumb product={product} className="size-8" />
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TD>
                    <TD className="text-right tabular">{formatNumber(p.units)}</TD>
                    <TD className="text-right font-medium whitespace-nowrap tabular">{formatMoney(p.revenue, { decimals: 0 })}</TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </SectionCard>
        <SectionCard title="Cuentas vencidas" description="Clientes con mayor deuda vencida" href="/cobranzas?filtro=vencido" className="lg:col-span-2">
          <CardContent>
            <BarList
              items={overdue.map((o) => ({
                key: o.customer.id,
                label: o.customer.businessName,
                value: o.account.overdueDebt,
                display: formatMoney(o.account.overdueDebt, { decimals: 0 }),
                secondary: `${o.account.oldestOverdueDays} días`,
                color: "var(--destructive)",
                href: `/clientes/${o.customer.id}`,
              }))}
            />
          </CardContent>
        </SectionCard>
      </div>
    </div>
  );
}
