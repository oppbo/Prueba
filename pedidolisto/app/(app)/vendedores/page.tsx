"use client";

import { useMemo, useState } from "react";
import { MapPin, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { SectionCard } from "@/components/shared/section-card";
import { FilterChips } from "@/components/shared/filter-chips";
import { Avatar } from "@/components/shared/avatar";
import { BarList } from "@/components/charts/bar-list";
import { coverageFactor, ordersInRange, rangeStart, sellerStats, RANGE_LABEL, type RangeKey } from "@/lib/domain/analytics";
import { formatMoney, formatNumber, formatPhone } from "@/lib/format";
import { useData } from "@/lib/store/hooks";

export default function SalespeoplePage() {
  const data = useData();
  const [range, setRange] = useState<RangeKey>("7d");

  const today = useMemo(() => {
    const orders = ordersInRange(data.orders, "today");
    const from = rangeStart("today");
    return sellerStats(orders, data.payments.filter((p) => new Date(p.date) >= from), data.salespeople.map((s) => s.id));
  }, [data]);

  const period = useMemo(() => {
    const orders = ordersInRange(data.orders, range);
    const from = rangeStart(range);
    const k = coverageFactor(data, range);
    return sellerStats(orders, data.payments.filter((p) => new Date(p.date) >= from), data.salespeople.map((s) => s.id))
      .map((r) => ({ ...r, sales: r.sales * k, credit: r.credit * k, cash: r.cash * k, collected: r.collected * k, orders: Math.round(r.orders * k) }))
      .sort((a, b) => b.sales - a.sales);
  }, [data, range]);

  return (
    <div className="space-y-6">
      <PageHeader title="Vendedores" description="Ventas, cobranzas y cobertura de cada vendedor en ruta." />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {data.salespeople.map((s) => {
          const t = today.find((r) => r.salespersonId === s.id)!;
          const progress = Math.min(100, Math.round((t.sales / s.dailyTarget) * 100));
          const visited = t.customers + s.extraVisitsToday;
          const metrics = [
            ["Ventas hoy", formatMoney(t.sales, { decimals: 0 })],
            ["Pedidos", formatNumber(t.orders)],
            ["Cobrado", formatMoney(t.collected, { decimals: 0 })],
            ["A crédito", formatMoney(t.credit, { decimals: 0 })],
          ];
          return (
            <Card key={s.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col pt-5">
                <div className="flex items-center gap-3">
                  <Avatar name={s.name} color={s.color} className="size-10" />
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{s.name}</p>
                    <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                      <MapPin className="size-3" /> {s.zones.join(", ")}
                    </p>
                  </div>
                </div>
                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-3">
                  {metrics.map(([k, v]) => (
                    <div key={k}>
                      <dt className="text-xs text-muted-foreground">{k}</dt>
                      <dd className="mt-0.5 text-base font-semibold tabular">{v}</dd>
                    </div>
                  ))}
                  <div className="col-span-2">
                    <dt className="text-xs text-muted-foreground">Clientes visitados</dt>
                    <dd className="mt-0.5 text-base font-semibold tabular">
                      {visited} <span className="text-xs font-normal text-muted-foreground">· {t.customers} con compra</span>
                    </dd>
                  </div>
                </dl>
                <div className="mt-auto pt-5">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Meta diaria</span>
                    <span className="tabular">{progress}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted">
                    <div className="h-full rounded-full" style={{ width: `${progress}%`, backgroundColor: s.color }} />
                  </div>
                  <a href={`tel:+591${s.phone}`} className="mt-4 inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
                    <Phone className="size-3" /> {formatPhone(s.phone)}
                  </a>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <SectionCard
        title="Comparativo"
        description="Ventas por vendedor en el periodo"
        action={<FilterChips value={range} onChange={setRange} options={(["today", "7d", "30d"] as RangeKey[]).map((r) => ({ value: r, label: RANGE_LABEL[r] }))} className="mx-0 px-0" />}
      >
        <div className="grid gap-6 px-5 pb-5 lg:grid-cols-[1fr_1.4fr]">
          <BarList
            items={period.map((r) => {
              const s = data.salespeople.find((x) => x.id === r.salespersonId)!;
              return { key: s.id, label: s.name, value: r.sales, display: formatMoney(r.sales, { decimals: 0 }), secondary: `${r.orders} pedidos`, color: s.color };
            })}
          />
          <div className="-mx-5 lg:mx-0">
            <Table>
              <THead>
                <tr>
                  <TH>Vendedor</TH>
                  <TH className="text-right">Ticket prom.</TH>
                  <TH className="text-right">Cobrado</TH>
                  <TH className="text-right">% crédito</TH>
                  <TH className="text-right">Clientes</TH>
                </tr>
              </THead>
              <TBody>
                {period.map((r) => {
                  const s = data.salespeople.find((x) => x.id === r.salespersonId)!;
                  return (
                    <TR key={r.salespersonId}>
                      <TD className="font-medium whitespace-nowrap">{s.name}</TD>
                      <TD className="text-right tabular">{formatMoney(r.orders ? r.sales / r.orders : 0, { decimals: 0 })}</TD>
                      <TD className="text-right tabular">{formatMoney(r.collected, { decimals: 0 })}</TD>
                      <TD className="text-right tabular">{r.sales ? Math.round((r.credit / r.sales) * 100) : 0}%</TD>
                      <TD className="text-right tabular">{r.customers}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
          </div>
        </div>
      </SectionCard>
    </div>
  );
}
