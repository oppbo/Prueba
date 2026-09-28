import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CalendarDays, CheckCircle2, Clock, Landmark, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LogoMark } from "@/components/shared/logo";
import { CopyButton } from "@/components/shared/copy-button";
import { ProofForm } from "@/components/portal/proof-form";
import { getPaymentPage } from "@/lib/data/portal";
import { formatBs, formatDate } from "@/lib/format";
import { initials } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Pago de factura",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function PaymentPortalPage({ params }: PageProps<"/p/[token]">) {
  const { token } = await params;
  const result = await getPaymentPage(token);
  if (!result) notFound();
  const { data, qrUrl } = result;
  const { organization: org, invoice, customer } = data;
  const outstanding = Number(invoice.outstanding_amount);
  const pending = Number(data.pending_amount);
  const isPaid = invoice.status === "paid" || outstanding <= 0;
  const isCancelled = invoice.status === "cancelled";

  return (
    <div className="min-h-dvh bg-muted/60">
      <div className="mx-auto w-full max-w-md px-4 pt-6 pb-10">
        <header className="flex items-center gap-3">
          <span className="flex size-11 items-center justify-center rounded-xl bg-zinc-900 text-sm font-semibold text-white" aria-hidden>
            {initials(org.name)}
          </span>
          <div className="min-w-0">
            <p className="truncate font-semibold">{org.name}</p>
            <p className="truncate text-[13px] text-muted-foreground">{[org.legal_name, org.city].filter(Boolean).join(" · ") || "Cobro de factura"}</p>
          </div>
        </header>

        <main className="mt-6 grid gap-4">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-xs" aria-labelledby="amount-heading">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[13px] text-muted-foreground">Hola,</p>
                <p className="font-medium">{customer.name}</p>
              </div>
              {isCancelled ? (
                <Badge tone="neutral">Anulada</Badge>
              ) : isPaid ? (
                <Badge tone="success" dot>
                  Pagada
                </Badge>
              ) : invoice.is_overdue ? (
                <Badge tone="danger" dot>
                  Vencida
                </Badge>
              ) : (
                <Badge tone="info" dot>
                  Pendiente
                </Badge>
              )}
            </div>
            <p id="amount-heading" className="mt-5 text-[13px] font-medium text-muted-foreground">
              Monto pendiente
            </p>
            <p className="tabular mt-1 text-4xl font-semibold tracking-tight">{formatBs(isCancelled ? 0 : outstanding)}</p>
            <dl className="mt-5 grid grid-cols-2 gap-3 border-t border-border pt-4 text-sm">
              <div>
                <dt className="text-[13px] text-muted-foreground">Factura</dt>
                <dd className="font-medium">{invoice.invoice_number}</dd>
              </div>
              <div>
                <dt className="flex items-center gap-1 text-[13px] text-muted-foreground">
                  <CalendarDays className="size-3.5" aria-hidden /> Vencimiento
                </dt>
                <dd className="font-medium">{formatDate(invoice.due_date)}</dd>
              </div>
              {invoice.description && (
                <div className="col-span-2">
                  <dt className="text-[13px] text-muted-foreground">Detalle</dt>
                  <dd>{invoice.description}</dd>
                </div>
              )}
              {outstanding < Number(invoice.original_amount) && !isCancelled && (
                <div className="col-span-2">
                  <dt className="text-[13px] text-muted-foreground">Monto original</dt>
                  <dd>{formatBs(invoice.original_amount)}</dd>
                </div>
              )}
            </dl>
          </section>

          {pending > 0 && !isPaid && (
            <p className="flex items-start gap-2 rounded-xl border border-warning/25 bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground" role="status">
              <Clock className="mt-0.5 size-4 shrink-0" aria-hidden />
              Recibimos un comprobante por {formatBs(pending)} que está en verificación.
            </p>
          )}

          {isCancelled ? (
            <p className="rounded-2xl border border-border bg-card p-5 text-sm text-muted-foreground">
              Esta factura fue anulada. Si tienes dudas, comunícate con {org.name}
              {org.phone ? ` al ${org.phone}` : ""}.
            </p>
          ) : isPaid ? (
            <div className="rounded-2xl border border-primary/20 bg-primary-soft p-6 text-center">
              <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden />
              <p className="mt-3 font-semibold text-primary-soft-foreground">¡Gracias! Esta factura ya está pagada.</p>
            </div>
          ) : (
            <>
              <section className="rounded-2xl border border-border bg-card p-5 shadow-xs" aria-labelledby="pay-heading">
                <h2 id="pay-heading" className="flex items-center gap-2 font-semibold">
                  <Landmark className="size-4 text-primary" aria-hidden /> Cómo pagar
                </h2>
                {qrUrl ? (
                  <>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Escanea el QR desde tu aplicación bancaria y realiza el pago por el monto indicado.
                    </p>
                    <div className="mt-4 flex justify-center rounded-xl border border-border bg-white p-4">
                      {/* eslint-disable-next-line @next/next/no-img-element -- short-lived signed URL */}
                      <img src={qrUrl} alt={`Código QR de pago de ${org.name}`} className="aspect-square w-full max-w-64 object-contain" />
                    </div>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-muted-foreground">Realiza una transferencia bancaria por el monto indicado con los siguientes datos.</p>
                )}
                {(org.bank_name || org.bank_account_name || org.bank_account_number) && (
                  <dl className="mt-4 grid gap-2 rounded-xl bg-muted/70 p-4 text-sm">
                    {org.bank_name && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Banco</dt>
                        <dd className="text-right font-medium">{org.bank_name}</dd>
                      </div>
                    )}
                    {org.bank_account_name && (
                      <div className="flex justify-between gap-3">
                        <dt className="text-muted-foreground">Titular</dt>
                        <dd className="text-right font-medium">{org.bank_account_name}</dd>
                      </div>
                    )}
                    {org.bank_account_number && (
                      <div className="flex items-center justify-between gap-3">
                        <dt className="text-muted-foreground">Cuenta</dt>
                        <dd className="flex items-center gap-2 font-medium">
                          <span className="tabular">{org.bank_account_number}</span>
                          <CopyButton value={org.bank_account_number} label="Copiar" size="sm" variant="ghost" successMessage="Número de cuenta copiado" />
                        </dd>
                      </div>
                    )}
                  </dl>
                )}
                {!qrUrl && !org.bank_name && !org.bank_account_number && (
                  <p className="mt-3 rounded-lg bg-warning-soft p-3 text-sm text-warning-soft-foreground">
                    {org.name} aún no configuró sus datos de pago. Comunícate con ellos{org.phone ? ` al ${org.phone}` : ""}.
                  </p>
                )}
                <p className="mt-4 text-xs text-muted-foreground">
                  Después de pagar, envía tu comprobante para que {org.name} lo verifique.
                </p>
              </section>

              <ProofForm token={token} suggestedAmount={Math.max(outstanding - pending, 0) || outstanding} />
            </>
          )}
        </main>

        <footer className="mt-8 flex flex-col items-center gap-2 text-center text-xs text-muted-foreground">
          <p className="flex items-center gap-1.5">
            <ShieldCheck className="size-3.5" aria-hidden /> Tus datos se envían de forma segura solo a {org.name}.
          </p>
          <p className="flex items-center gap-1.5">
            <LogoMark className="size-4" /> Cobros gestionados con CobraYa
          </p>
        </footer>
      </div>
    </div>
  );
}
