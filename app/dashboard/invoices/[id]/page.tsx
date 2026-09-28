import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, FileText, Receipt } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { InvoiceStatusBadge, PaymentStatusBadge } from "@/components/shared/status-badge";
import { Timeline } from "@/components/dashboard/activity-feed";
import { ReminderDialog } from "@/components/collections/reminder-dialog";
import { PaymentDialog } from "@/components/collections/payment-dialog";
import { NoteDialog } from "@/components/collections/note-dialog";
import { toCollectible } from "@/components/collections/types";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { CancelInvoiceButton } from "@/components/invoices/cancel-invoice-button";
import { PaymentLinkButton } from "@/components/invoices/payment-link-button";
import { listCustomerOptions } from "@/lib/data/customers";
import { getInvoiceDetail } from "@/lib/data/invoices";
import { uuid } from "@/lib/validation/common";
import { dueLabel, formatDate, formatDateTime, todayBo } from "@/lib/format";
import { PAYMENT_METHOD } from "@/lib/labels";
import { formatPhone } from "@/lib/phone";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Factura" };

export default async function InvoiceDetailPage({ params }: PageProps<"/dashboard/invoices/[id]">) {
  const { id } = await params;
  if (!uuid.safeParse(id).success) notFound();
  const session = await requireSession();
  const [detail, customers] = await Promise.all([getInvoiceDetail(session.organization.id, id), listCustomerOptions(session.organization.id)]);
  if (!detail) notFound();
  const { invoice, payments, events, paid } = detail;
  const status = invoice.effective_status;
  const isOpen = status === "pending" || status === "partially_paid" || status === "overdue";
  const progress = Math.min(100, Math.round((paid / Number(invoice.original_amount)) * 100));
  const pendingProofs = payments.filter((p) => p.status === "pending_verification");

  return (
    <div className="grid gap-6">
      <div>
        <Link href="/dashboard/invoices" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" aria-hidden /> Facturas
        </Link>
        <div className="mt-3 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">Factura {invoice.invoice_number}</h1>
              <InvoiceStatusBadge status={status} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              <Link href={`/dashboard/customers/${invoice.customer_id}`} className="font-medium text-foreground hover:underline">
                {invoice.customer_name}
              </Link>{" "}
              · {formatPhone(invoice.customer_phone)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {isOpen && (
              <>
                <ReminderDialog invoices={[toCollectible(invoice)]} triggerLabel="Enviar recordatorio" triggerProps={{ size: "default" }} />
                <PaymentDialog invoice={toCollectible(invoice)} triggerProps={{ size: "default" }} />
                <PaymentLinkButton invoiceId={invoice.id} />
              </>
            )}
            {status !== "cancelled" && <InvoiceFormDialog customers={customers} invoice={invoice} />}
            {isOpen && paid === 0 && pendingProofs.length === 0 && <CancelInvoiceButton invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} />}
          </div>
        </div>
      </div>

      {pendingProofs.length > 0 && (
        <Link
          href="/dashboard/payments"
          className="flex items-center gap-3 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground hover:bg-warning-soft/70"
        >
          <Receipt className="size-4" aria-hidden />
          <span className="flex-1">Hay {pendingProofs.length === 1 ? "un comprobante" : `${pendingProofs.length} comprobantes`} por verificar para esta factura.</span>
          <span className="font-medium">Revisar</span>
        </Link>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="grid content-start gap-6">
          <Card>
            <CardContent className="grid gap-5 pt-5 sm:grid-cols-3">
              <div>
                <p className="text-[13px] text-muted-foreground">Monto original</p>
                <Money value={invoice.original_amount} className="mt-1 block text-xl font-semibold" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Pagado</p>
                <Money value={paid} className="mt-1 block text-xl font-semibold text-primary" />
              </div>
              <div>
                <p className="text-[13px] text-muted-foreground">Saldo pendiente</p>
                <Money
                  value={status === "cancelled" ? 0 : invoice.outstanding_amount}
                  className={cn("mt-1 block text-xl font-semibold", status === "overdue" && "text-destructive")}
                />
              </div>
              <div className="sm:col-span-3">
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-valuenow={progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label="Porcentaje pagado"
                >
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">{progress}% pagado</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detalle</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Emisión</dt>
                  <dd className="mt-0.5 font-medium">{formatDate(invoice.issue_date)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Vencimiento</dt>
                  <dd className="mt-0.5 font-medium">
                    {formatDate(invoice.due_date)}
                    {isOpen && (
                      <span className={cn("ml-2 text-xs font-normal", status === "overdue" ? "text-destructive" : "text-muted-foreground")}>
                        {dueLabel(invoice.due_date, todayBo())}
                      </span>
                    )}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground">Descripción</dt>
                  <dd className="mt-0.5">{invoice.description ?? "—"}</dd>
                </div>
                {invoice.notes && (
                  <div className="sm:col-span-2">
                    <dt className="text-muted-foreground">Notas internas</dt>
                    <dd className="mt-0.5 whitespace-pre-line">{invoice.notes}</dd>
                  </div>
                )}
              </dl>
            </CardContent>
          </Card>

          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Pagos</CardTitle>
            </CardHeader>
            {payments.length === 0 ? (
              <EmptyState icon={Receipt} title="Aún no hay pagos para esta factura" className="pt-4" />
            ) : (
              <ul className="divide-y divide-border border-t border-border">
                {payments.map((p) => (
                  <li key={p.id} className="flex items-center justify-between gap-3 px-5 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        <Money value={p.amount} /> <span className="font-normal text-muted-foreground">· {PAYMENT_METHOD[p.payment_method]}</span>
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatDate(p.payment_date)}
                        {p.reference ? ` · Ref. ${p.reference}` : ""}
                        {p.submitted_by_customer ? " · Enviado por el cliente" : ""}
                      </p>
                    </div>
                    <PaymentStatusBadge status={p.status} />
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        <Card className="content-start">
          <CardHeader>
            <CardTitle>Historial</CardTitle>
            <NoteDialog customerId={invoice.customer_id} invoiceId={invoice.id} subtitle={`Factura ${invoice.invoice_number}`} />
          </CardHeader>
          <CardContent>
            {events.length === 0 ? (
              <EmptyState icon={CalendarDays} title="Sin actividad todavía" className="py-8" />
            ) : (
              <Timeline events={events} />
            )}
            <p className="mt-6 flex items-center gap-1.5 border-t border-border pt-4 text-xs text-muted-foreground">
              <FileText className="size-3.5" aria-hidden /> Creada el {formatDateTime(invoice.created_at)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
