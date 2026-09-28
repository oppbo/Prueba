import type { Metadata } from "next";
import Link from "next/link";
import { CheckCircle2, FileText, Inbox, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { SegmentedNav } from "@/components/shared/segmented-nav";
import { PaymentStatusBadge } from "@/components/shared/status-badge";
import { PaymentReviewActions } from "@/components/payments/payment-review-actions";
import { PAYMENT_TABS, listPayments } from "@/lib/data/payments";
import { oneOf } from "@/lib/data/query";
import { formatDate, formatDateTime } from "@/lib/format";
import { PAYMENT_METHOD } from "@/lib/labels";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Pagos" };

const EMPTY = {
  pending: { title: "No hay comprobantes por verificar", description: "Cuando un cliente envíe su comprobante desde el link de pago, aparecerá aquí.", icon: Inbox },
  verified: { title: "Aún no hay pagos verificados", description: undefined, icon: CheckCircle2 },
  rejected: { title: "No hay comprobantes rechazados", description: undefined, icon: XCircle },
};

export default async function PaymentsPage({ searchParams }: PageProps<"/dashboard/payments">) {
  const session = await requireSession();
  const params = await searchParams;
  const tab = oneOf(params.tab, PAYMENT_TABS, "pending");
  const { items, counts } = await listPayments(session.organization.id, tab);
  const empty = EMPTY[tab];

  return (
    <div>
      <PageHeader title="Pagos" description="Verifica los comprobantes que envían tus clientes y revisa el historial de pagos." />
      <div className="mb-4">
        <SegmentedNav
          label="Estado de pagos"
          active={tab}
          items={[
            { key: "pending", label: "Por verificar", count: counts.pending, href: "/dashboard/payments" },
            { key: "verified", label: "Verificados", count: counts.verified, href: "/dashboard/payments?tab=verified" },
            { key: "rejected", label: "Rechazados", count: counts.rejected, href: "/dashboard/payments?tab=rejected" },
          ]}
        />
      </div>

      {items.length === 0 ? (
        <Card>
          <EmptyState icon={empty.icon} title={empty.title} description={empty.description} />
        </Card>
      ) : (
        <ul className="grid gap-3">
          {items.map((p) => (
            <li key={p.id}>
              <Card className="p-4 sm:p-5">
                <div className="flex flex-col gap-4 sm:flex-row">
                  <ProofThumb url={p.proof_url} isPdf={p.proof_is_pdf} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <Link href={`/dashboard/customers/${p.customer_id}`} className="font-medium hover:underline">
                          {p.customer_name}
                        </Link>
                        <p className="text-[13px] text-muted-foreground">
                          {p.invoice_number && p.invoice_id ? (
                            <Link href={`/dashboard/invoices/${p.invoice_id}`} className="hover:text-foreground hover:underline">
                              Factura {p.invoice_number}
                            </Link>
                          ) : (
                            "Sin factura"
                          )}
                          {" · "}
                          {PAYMENT_METHOD[p.payment_method]}
                          {p.submitted_by_customer ? " · Enviado por el cliente" : " · Registrado por tu equipo"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[13px] text-muted-foreground">{tab === "pending" ? "Monto reportado" : "Monto"}</p>
                        <Money value={p.amount} className="text-lg font-semibold" />
                      </div>
                    </div>
                    <dl className="mt-3 grid gap-x-6 gap-y-1 text-[13px] sm:grid-cols-3">
                      <div>
                        <dt className="text-muted-foreground">Fecha</dt>
                        <dd>{formatDate(p.payment_date)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Referencia</dt>
                        <dd className="truncate">{p.reference ?? "—"}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">{tab === "pending" ? "Recibido" : "Procesado"}</dt>
                        <dd>{formatDateTime(tab === "pending" ? p.created_at : (p.verified_at ?? p.updated_at))}</dd>
                      </div>
                    </dl>
                    {p.notes && <p className="mt-3 rounded-lg bg-muted p-2.5 text-[13px] text-muted-foreground">{p.notes}</p>}
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                      <PaymentStatusBadge status={p.status} />
                      {tab === "pending" && (
                        <PaymentReviewActions
                          paymentId={p.id}
                          amount={Number(p.amount)}
                          customerName={p.customer_name}
                          invoiceNumber={p.invoice_number}
                          invoiceOutstanding={p.invoice_outstanding}
                        />
                      )}
                    </div>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProofThumb({ url, isPdf }: { url: string | null; isPdf: boolean }) {
  if (!url) {
    return (
      <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-lg border border-dashed border-border text-xs text-muted-foreground sm:w-24">
        Sin archivo
      </div>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group relative flex h-40 w-full shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted sm:h-24 sm:w-24"
      title="Abrir comprobante"
    >
      {isPdf ? (
        <span className="flex flex-col items-center gap-1 text-xs text-muted-foreground">
          <FileText className="size-6" aria-hidden /> PDF
        </span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL
        <img src={url} alt="Comprobante de pago" className="size-full object-cover transition-transform group-hover:scale-105" />
      )}
      <span className="sr-only">Abrir comprobante en una pestaña nueva</span>
    </a>
  );
}
