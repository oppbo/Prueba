import type { Metadata } from "next";
import Link from "next/link";
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, FileUp, Receipt, TrendingUp, Wallet } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { buttonVariants } from "@/components/ui/button";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { OverdueBadge } from "@/components/shared/status-badge";
import { MetricCard } from "@/components/dashboard/metric-card";
import { ReceivablesChart } from "@/components/dashboard/receivables-chart";
import { Timeline } from "@/components/dashboard/activity-feed";
import { ReminderDialog } from "@/components/collections/reminder-dialog";
import { toCollectible } from "@/components/collections/types";
import { getDashboardData } from "@/lib/data/dashboard";
import { dueLabel, formatBs, formatDate, TIMEZONE } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { firstName } from "@/lib/utils";

export const metadata: Metadata = { title: "Inicio" };

function greeting(): string {
  const hour = Number(new Intl.DateTimeFormat("en-US", { timeZone: TIMEZONE, hour: "numeric", hour12: false }).format(new Date()));
  if (hour < 12) return "Buenos días";
  if (hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export default async function DashboardPage() {
  const session = await requireSession();
  const data = await getDashboardData(session.organization.id);
  const name = firstName(session.fullName);
  const { metrics } = data;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            {greeting()}
            {name ? `, ${name}` : ""}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Así están tus cobranzas hoy.</p>
        </div>
        <Link href="/dashboard/collections" className={buttonVariants()}>
          Ir a cobranza <ArrowRight />
        </Link>
      </div>

      {metrics.pendingProofsCount > 0 && (
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground transition-colors hover:bg-warning-soft/70"
        >
          <Receipt className="size-4 shrink-0" aria-hidden />
          <span className="flex-1">
            <strong>{metrics.pendingProofsCount}</strong> {metrics.pendingProofsCount === 1 ? "comprobante espera" : "comprobantes esperan"} verificación
            ({formatBs(metrics.pendingProofsAmount)}).
          </span>
          <span className="font-medium">Revisar</span>
          <ArrowRight className="size-4" aria-hidden />
        </Link>
      )}

      <section aria-label="Resumen" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Total por cobrar"
          value={metrics.totalReceivable}
          detail={`${metrics.openCount} ${metrics.openCount === 1 ? "factura abierta" : "facturas abiertas"}`}
          icon={Wallet}
        />
        <MetricCard
          label="Vencido"
          value={metrics.overdueAmount}
          detail={metrics.overdueCount ? `${metrics.overdueCount} ${metrics.overdueCount === 1 ? "factura vencida" : "facturas vencidas"}` : "Sin facturas vencidas"}
          icon={AlertTriangle}
          tone="danger"
        />
        <MetricCard label="Cobrado este mes" value={metrics.collectedThisMonth} detail="Pagos verificados" icon={TrendingUp} tone="success" />
        <MetricCard
          label="Por vencer esta semana"
          value={metrics.dueThisWeekAmount}
          detail={`${metrics.dueThisWeekCount} ${metrics.dueThisWeekCount === 1 ? "factura" : "facturas"} en 7 días`}
          icon={CalendarClock}
          tone="warning"
        />
      </section>

      {!data.hasInvoices ? (
        <Card>
          <EmptyState
            icon={FileUp}
            title="Todavía no tienes facturas pendientes"
            description="Importa tu Excel de cuentas por cobrar o registra tu primera factura para ver aquí tus métricas."
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Link href="/dashboard/import" className={buttonVariants()}>
                  Importar CSV
                </Link>
                <Link href="/dashboard/invoices?new=1" className={buttonVariants({ variant: "secondary" })}>
                  Nueva factura
                </Link>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Cuentas por cobrar</CardTitle>
                  <CardDescription>Cobrado vs. saldo pendiente, últimos 6 meses</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <ReceivablesChart data={data.months} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Próximos vencimientos</CardTitle>
                  <CardDescription>Facturas que vencen en los próximos 7 días</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {data.upcoming.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="Nada vence esta semana" className="py-8" />
                ) : (
                  <ul className="grid gap-1">
                    {data.upcoming.map((inv) => (
                      <li key={inv.id}>
                        <Link
                          href={`/dashboard/invoices/${inv.id}`}
                          className="-mx-2 flex items-center justify-between gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-muted"
                        >
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{inv.customer_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {inv.invoice_number} · {dueLabel(inv.due_date, data.today)}
                            </p>
                          </div>
                          <Money value={inv.outstanding_amount} className="text-sm font-medium" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <Card className="overflow-hidden">
              <CardHeader>
                <div>
                  <CardTitle>Facturas que requieren atención</CardTitle>
                  <CardDescription>Vencidas, ordenadas por días de atraso y monto</CardDescription>
                </div>
                <Link href="/dashboard/collections" className="shrink-0 text-sm font-medium text-primary hover:underline">
                  Ver todas
                </Link>
              </CardHeader>
              {data.attention.length === 0 ? (
                <EmptyState icon={CheckCircle2} title="¡Todo al día! No tienes facturas vencidas." className="pb-10" />
              ) : (
                <>
                  <div className="hidden md:block">
                    <Table>
                      <THead>
                        <TR className="hover:bg-transparent">
                          <TH>Cliente</TH>
                          <TH>Factura</TH>
                          <TH className="text-right">Monto</TH>
                          <TH>Vencimiento</TH>
                          <TH>Atraso</TH>
                          <TH className="text-right">
                            <span className="sr-only">Acción</span>
                          </TH>
                        </TR>
                      </THead>
                      <TBody>
                        {data.attention.map((inv) => (
                          <TR key={inv.id} className={inv.days_overdue > 30 ? "bg-destructive-soft/40" : undefined}>
                            <TD className="max-w-48">
                              <Link href={`/dashboard/customers/${inv.customer_id}`} className="block truncate font-medium hover:underline">
                                {inv.customer_name}
                              </Link>
                            </TD>
                            <TD className="whitespace-nowrap">
                              <Link href={`/dashboard/invoices/${inv.id}`} className="text-muted-foreground hover:text-foreground hover:underline">
                                {inv.invoice_number}
                              </Link>
                            </TD>
                            <TD className="text-right font-medium">
                              <Money value={inv.outstanding_amount} />
                            </TD>
                            <TD className="whitespace-nowrap text-muted-foreground">{formatDate(inv.due_date)}</TD>
                            <TD>
                              <OverdueBadge days={inv.days_overdue} />
                            </TD>
                            <TD className="text-right">
                              <ReminderDialog invoices={[toCollectible(inv)]} triggerLabel="Recordar" />
                            </TD>
                          </TR>
                        ))}
                      </TBody>
                    </Table>
                  </div>
                  <ul className="divide-y divide-border border-t border-border md:hidden">
                    {data.attention.map((inv) => (
                      <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3.5">
                        <Link href={`/dashboard/invoices/${inv.id}`} className="min-w-0">
                          <p className="truncate text-sm font-medium">{inv.customer_name}</p>
                          <p className="text-xs text-muted-foreground">
                            {inv.invoice_number} · <span className="text-destructive">{dueLabel(inv.due_date, data.today)}</span>
                          </p>
                          <Money value={inv.outstanding_amount} className="mt-1 block text-sm font-semibold" />
                        </Link>
                        <ReminderDialog invoices={[toCollectible(inv)]} triggerLabel="Recordar" />
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </Card>

            <Card>
              <CardHeader>
                <div>
                  <CardTitle>Actividad reciente</CardTitle>
                  <CardDescription>Pagos, recordatorios y comprobantes</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                {data.activity.length === 0 ? (
                  <EmptyState icon={CheckCircle2} title="Aún no hay actividad" className="py-8" />
                ) : (
                  <Timeline events={data.activity} showCustomer compact />
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
