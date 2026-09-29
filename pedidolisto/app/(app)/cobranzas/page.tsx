"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { AlertTriangle, BellRing, CalendarClock, HandCoins, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { KpiCard } from "@/components/shared/kpi-card";
import { SearchInput } from "@/components/shared/search-input";
import { FilterChips } from "@/components/shared/filter-chips";
import { EmptyState } from "@/components/shared/empty-state";
import { SectionCard } from "@/components/shared/section-card";
import { Avatar } from "@/components/shared/avatar";
import { Pagination, paginate } from "@/components/shared/pagination";
import { BarList } from "@/components/charts/bar-list";
import { PAYMENT_METHOD } from "@/lib/labels";
import { addDays, formatDateTime, formatMoney, formatNumber, formatRelativeDay, formatShortDate, startOfDay } from "@/lib/format";
import { useAccounts, useData, useLookups } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { cn, normalizeText } from "@/lib/utils";

type Filter = "all" | "overdue" | "week" | "current";
const PAGE_SIZE = 15;

export default function CollectionsPage() {
  const data = useData();
  const accounts = useAccounts();
  const lookups = useLookups();
  const params = useSearchParams();
  const openPayment = useUiStore((s) => s.openPayment);
  const openReminder = useUiStore((s) => s.openReminder);
  const initial = params.get("filtro");
  const [filter, setFilter] = useState<Filter>(initial === "vencido" ? "overdue" : initial === "semana" ? "week" : "all");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);

  const debtors = useMemo(
    () =>
      data.customers
        .map((c) => ({ customer: c, account: accounts.get(c.id)! }))
        .filter((r) => r.account.currentDebt > 0)
        .sort((a, b) => b.account.overdueDebt - a.account.overdueDebt || b.account.currentDebt - a.account.currentDebt),
    [data.customers, accounts],
  );

  const weekEnd = addDays(startOfDay(), 7);
  const dueSoon = (r: (typeof debtors)[number]) => r.account.dueThisWeek > 0 && !!r.account.nextDueDate && new Date(r.account.nextDueDate) <= weekEnd;
  const totals = {
    receivable: debtors.reduce((a, r) => a + r.account.currentDebt, 0),
    overdue: debtors.reduce((a, r) => a + r.account.overdueDebt, 0),
    week: debtors.reduce((a, r) => a + r.account.dueThisWeek, 0),
  };

  const q = normalizeText(query.trim());
  const searched = debtors.filter((r) => !q || normalizeText(`${r.customer.businessName} ${r.customer.ownerName} ${r.customer.zone}`).includes(q));
  const filtered = searched.filter((r) =>
    filter === "overdue" ? r.account.overdueDebt > 0 : filter === "week" ? dueSoon(r) : filter === "current" ? r.account.overdueDebt <= 0 : true,
  );
  const visible = paginate(filtered, page, PAGE_SIZE);

  const aging = useMemo(() => {
    const buckets = [
      { key: "1-15", label: "1 a 15 días", value: 0, count: 0 },
      { key: "16-30", label: "16 a 30 días", value: 0, count: 0 },
      { key: "31+", label: "Más de 30 días", value: 0, count: 0 },
    ];
    for (const r of debtors) {
      if (r.account.overdueDebt <= 0) continue;
      const b = r.account.oldestOverdueDays <= 15 ? buckets[0] : r.account.oldestOverdueDays <= 30 ? buckets[1] : buckets[2];
      b.value += r.account.overdueDebt;
      b.count += 1;
    }
    return buckets;
  }, [debtors]);

  const recentPayments = [...data.payments].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 6);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cuentas por cobrar"
        description="Quién te debe, cuánto está vencido y qué cobrar primero."
        actions={
          <Button onClick={() => openPayment()}>
            <HandCoins /> Registrar pago
          </Button>
        }
      />

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <KpiCard label="Por cobrar" value={formatMoney(totals.receivable, { decimals: 0 })} icon={Wallet} hint="Saldo total de clientes" />
        <KpiCard label="Vencido" value={formatMoney(totals.overdue, { decimals: 0 })} icon={AlertTriangle} tone="danger" hint={`${Math.round((totals.overdue / Math.max(totals.receivable, 1)) * 100)}% de la cartera`} />
        <KpiCard label="Vence esta semana" value={formatMoney(totals.week, { decimals: 0 })} icon={CalendarClock} tone="warning" hint="Próximos 7 días" />
        <KpiCard label="Clientes con deuda" value={formatNumber(debtors.length)} icon={Users} hint={`${debtors.filter((r) => r.account.overdueDebt > 0).length} con deuda vencida`} />
      </div>

      <div className="flex flex-col gap-3">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Buscar cliente..." className="sm:max-w-md" />
        <FilterChips
          value={filter}
          onChange={(v) => { setFilter(v); setPage(1); }}
          options={[
            { value: "all", label: "Todos", count: searched.length },
            { value: "overdue", label: "Vencido", count: searched.filter((r) => r.account.overdueDebt > 0).length },
            { value: "week", label: "Vence esta semana", count: searched.filter(dueSoon).length },
            { value: "current", label: "Al día", count: searched.filter((r) => r.account.overdueDebt <= 0).length },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Wallet} title="No hay cuentas con este filtro" />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Cliente</TH>
                    <TH className="text-right">Deuda total</TH>
                    <TH className="text-right">Vencido</TH>
                    <TH>Próximo vencimiento</TH>
                    <TH>Último pago</TH>
                    <TH className="hidden xl:table-cell">Vendedor</TH>
                    <TH className="text-right">Acciones</TH>
                  </tr>
                </THead>
                <TBody>
                  {visible.map(({ customer: c, account: a }) => (
                    <TR key={c.id}>
                      <TD>
                        <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 hover:text-primary">
                          <Avatar name={c.businessName} />
                          <span className="min-w-0">
                            <span className="block truncate font-medium">{c.businessName}</span>
                            <span className="block truncate text-xs text-muted-foreground">{c.zone}</span>
                          </span>
                        </Link>
                      </TD>
                      <TD className="text-right font-medium whitespace-nowrap tabular">{formatMoney(a.currentDebt)}</TD>
                      <TD className="text-right whitespace-nowrap">
                        {a.overdueDebt > 0 ? (
                          <span className="inline-flex flex-col items-end">
                            <span className="font-medium text-destructive tabular">{formatMoney(a.overdueDebt)}</span>
                            <span className="text-xs text-muted-foreground">hace {a.oldestOverdueDays} días</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD className="whitespace-nowrap">
                        {a.nextDueDate ? (
                          <span>
                            {formatShortDate(a.nextDueDate)} <span className="text-muted-foreground tabular">· {formatMoney(a.nextDueAmount)}</span>
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{formatRelativeDay(a.lastPaymentDate)}</TD>
                      <TD className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">{lookups.salesperson.get(c.salespersonId)?.name}</TD>
                      <TD>
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="secondary" onClick={() => openPayment(c.id)}>
                            Registrar pago
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => openReminder(c.id)}>
                            <BellRing /> Recordar pago
                          </Button>
                          <Button size="sm" variant="ghost" asChild>
                            <Link href={`/clientes/${c.id}`}>Ver cliente</Link>
                          </Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="divide-y divide-border lg:hidden">
              {visible.map(({ customer: c, account: a }) => (
                <li key={c.id} className="space-y-3 px-4 py-4">
                  <Link href={`/clientes/${c.id}`} className="flex items-center gap-3">
                    <Avatar name={c.businessName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.businessName}</p>
                      <p className="text-xs text-muted-foreground">
                        {c.zone} · últ. pago {formatRelativeDay(a.lastPaymentDate).toLowerCase()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold tabular">{formatMoney(a.currentDebt)}</p>
                      {a.overdueDebt > 0 && <p className="text-xs text-destructive tabular">{formatMoney(a.overdueDebt)} vencido</p>}
                    </div>
                  </Link>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openPayment(c.id)}>
                      <HandCoins /> Registrar pago
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => openReminder(c.id)}>
                      <BellRing /> Recordar
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <SectionCard title="Antigüedad de la deuda vencida" description="Mientras más antigua, más difícil de cobrar">
          <CardContent>
            <BarList
              items={aging.map((b, i) => ({
                key: b.key,
                label: b.label,
                value: b.value,
                display: formatMoney(b.value, { decimals: 0 }),
                secondary: `${b.count} clientes`,
                color: ["#e0a14a", "#d8742c", "#c6343a"][i],
              }))}
            />
          </CardContent>
        </SectionCard>
        <SectionCard title="Pagos recientes">
          <ul className="divide-y divide-border border-t border-border">
            {recentPayments.map((p) => {
              const c = lookups.customer.get(p.customerId);
              return (
                <li key={p.id} className="flex items-center gap-3 px-5 py-3 text-sm">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-success-soft text-success">
                    <HandCoins className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{c?.businessName}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {PAYMENT_METHOD[p.method]} · {formatDateTime(p.date)}
                      {p.salespersonId ? ` · ${lookups.salesperson.get(p.salespersonId)?.name.split(" ")[0]}` : ""}
                    </p>
                  </div>
                  <span className={cn("shrink-0 font-semibold text-success tabular")}>{formatMoney(p.amount)}</span>
                </li>
              );
            })}
          </ul>
        </SectionCard>
      </div>
    </div>
  );
}
