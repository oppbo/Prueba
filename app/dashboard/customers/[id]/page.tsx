import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Mail, MapPin, Phone, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { CustomerStatusBadge, InvoiceStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/dashboard/activity-feed";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { ReminderDialog } from "@/components/collections/reminder-dialog";
import { NoteDialog } from "@/components/collections/note-dialog";
import { toCollectible } from "@/components/collections/types";
import { getCustomerDetail, listCustomerOptions } from "@/lib/data/customers";
import { uuid } from "@/lib/validation/common";
import { dueLabel, formatDate, formatRelative, todayBo } from "@/lib/format";
import { PAYMENT_METHOD } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cliente" };

export default async function CustomerDetailPage({ params }: PageProps<"/dashboard/customers/[id]">) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const session = await requireSession();
  const [detail, customers] = await Promise.all([getCustomerDetail(session.organization.id, id), listCustomerOptions(session.organization.id)]);
  if (!detail) notFound();
  const { customer, invoices, payments, events } = detail;
  const today = todayBo();
  const open = invoices
    .filter((i) => ["pending", "partially_paid", "overdue"].includes(i.effective_status) && i.outstanding_amount > 0)
    .sort((a, b) => b.days_overdue - a.days_overdue || a.due_date.localeCompare(b.due_date));
  const closed = invoices.filter((i) => !open.includes(i));

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/dashboard/customers" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Clientes
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex min-w-0 items-center gap-4">
            <Avatar name={customer.name} className="size-12 text-sm" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="truncate text-2xl font-semibold tracking-tight">{customer.name}</h1>
                <CustomerStatusBadge status={customer.status} />
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">
                {customer.business_name ?? "Sin razón social"}
                {customer.nit ? ` · NIT ${customer.nit}` : ""}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {open.length > 0 && (
              <ReminderDialog invoices={open.map(toCollectible)} triggerLabel="Enviar recordatorio" triggerProps={{ size: "default" }} />
            )}
            <InvoiceFormDialog customers={customers} defaultCustomerId={customer.id} triggerProps={{ variant: "secondary" }} />
            <CustomerFormDialog customer={customer} />
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Deuda total</p>
          <Money value={customer.balance} className="mt-2 block text-2xl font-semibold" />
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Deuda vencida</p>
          <Money value={customer.overdue_balance} className={cn("mt-2 block text-2xl font-semibold", customer.overdue_balance > 0 && "text-destructive")} />
        </Card>
        <Card className="p-5">
          <p className="text-[13px] text-muted-foreground">Facturas pendientes</p>
          <p className="tabular mt-2 text-2xl font-semibold">{customer.open_invoices}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">Último contacto: {formatRelative(customer.last_contact_at).toLowerCase()}</p>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Facturas pendientes</CardTitle>
            </CardHeader>
            {open.length === 0 ? (
              <EmptyState icon={FileText} title="Este cliente está al día" description="No tiene facturas pendientes de pago." className="pt-4" />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {open.map((inv) => (
                  <li key={inv.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <Link href={`/dashboard/invoices/${inv.id}`} className="min-w-0 hover:underline">
                      <p className="text-sm font-medium">{inv.invoice_number}</p>
                      <p className={cn("text-xs", inv.effective_status === "overdue" ? "text-destructive" : "text-muted-foreground")}>
                        {dueLabel(inv.due_date, today)} · {formatDate(inv.due_date)}
                      </p>
                    </Link>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <Money value={inv.outstanding_amount} className="text-sm font-semibold" />
                        <div className="mt-0.5">
                          <InvoiceStatusBadge status={inv.effective_status} />
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Historial de pagos</CardTitle>
            </CardHeader>
            {payments.length === 0 ? (
              <EmptyState icon={Receipt} title="Todavía no hay pagos registrados" className="pt-4" />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        <Money value={p.amount} />
                        <span className="font-normal text-muted-foreground">
                          {" "}
                          · {PAYMENT_METHOD[p.payment_method]}
                          {p.invoice_number ? ` · ${p.invoice_number}` : ""}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDate(p.payment_date)}
                        {p.reference ? ` · Ref. ${p.reference}` : ""}
                      </p>
                    </div>
                    <PaymentStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {closed.length > 0 && (
            <Card className="overflow-hidden">
              <CardHeader>
                <CardTitle>Facturas pagadas o anuladas</CardTitle>
              </CardHeader>
              <ul className="divide-y divide-border border-t border-border">
                {closed.map((inv) => (
                  <li key={inv.id}>
                    <Link href={`/dashboard/invoices/${inv.id}`} className="flex items-center justify-between gap-3 px-5 py-3 hover:bg-muted/50">
                      <div>
                        <p className="text-sm font-medium">{inv.invoice_number}</p>
                        <p className="text-xs text-muted-foreground">Emitida {formatDate(inv.issue_date)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Money value={inv.original_amount} className="text-sm text-muted-foreground" />
                        <InvoiceStatusBadge status={inv.effective_status} />
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            </Card>
          )}
        </div>

        <div className="grid content-start gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Datos de contacto</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-3 text-sm">
                <div className="flex items-center gap-3">
                  <Phone className="size-4 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Teléfono</dt>
                  <dd>{formatPhone(customer.phone)}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <Mail className="size-4 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Correo</dt>
                  <dd className="truncate">{customer.email ?? "Sin correo"}</dd>
                </div>
                <div className="flex items-center gap-3">
                  <MapPin className="size-4 text-muted-foreground" aria-hidden />
                  <dt className="sr-only">Dirección</dt>
                  <dd>{[customer.address, customer.city].filter(Boolean).join(", ") || "Sin dirección"}</dd>
                </div>
              </dl>
              {customer.notes && <p className="mt-4 rounded-lg bg-muted p-3 text-sm whitespace-pre-line text-muted-foreground">{customer.notes}</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de cobranza</CardTitle>
              <NoteDialog customerId={customer.id} subtitle={customer.name} />
            </CardHeader>
            <CardContent>
              {events.length === 0 ? <EmptyState icon={CalendarDays} title="Sin actividad todavía" className="py-8" /> : <Timeline events={events} />}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
