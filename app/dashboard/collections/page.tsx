import type { Metadata } from "next";
import Link from "next/link";
import { CalendarCheck, CheckCircle2, PhoneOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { SegmentedNav } from "@/components/shared/segmented-nav";
import { OverdueBadge } from "@/components/shared/status-badge";
import { ReminderDialog } from "@/components/collections/reminder-dialog";
import { PaymentDialog } from "@/components/collections/payment-dialog";
import { NoteDialog } from "@/components/collections/note-dialog";
import { toCollectible } from "@/components/collections/types";
import { COLLECTION_SEGMENTS, NO_CONTACT_DAYS, getCollectionQueue } from "@/lib/data/collections";
import { oneOf } from "@/lib/data/query";
import { dueLabel, formatBs, formatDate, formatRelative } from "@/lib/format";
import { formatPhone } from "@/lib/phone";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Cobranza" };

const COPY = {
  overdue: {
    label: "Vencidas",
    description: "Priorizadas por días de atraso y monto.",
    empty: "¡Todo al día! No tienes facturas vencidas.",
    icon: CheckCircle2,
  },
  soon: {
    label: "Vencen pronto",
    description: "Vencen en los próximos 7 días: un recordatorio a tiempo evita el atraso.",
    empty: "Ninguna factura vence en los próximos 7 días.",
    icon: CalendarCheck,
  },
  nocontact: {
    label: "Sin contacto reciente",
    description: `Facturas abiertas sin recordatorio ni nota en los últimos ${NO_CONTACT_DAYS} días.`,
    empty: "Has contactado a todos tus clientes con saldo esta semana.",
    icon: PhoneOff,
  },
} as const;

export default async function CollectionsPage({ searchParams }: PageProps<"/dashboard/collections">) {
  const session = await requireSession();
  const params = await searchParams;
  const segment = oneOf(params.segment, COLLECTION_SEGMENTS, "overdue");
  const { rows, counts, total, today } = await getCollectionQueue(session.organization.id, segment);
  const copy = COPY[segment];

  return (
    <div>
      <PageHeader title="Cobranza" description="Tu lista de trabajo del día: a quién llamar, recordar o registrar pago." />
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SegmentedNav
          label="Segmentos de cobranza"
          active={segment}
          items={COLLECTION_SEGMENTS.map((key) => ({
            key,
            label: COPY[key].label,
            count: counts[key],
            href: key === "overdue" ? "/dashboard/collections" : `/dashboard/collections?segment=${key}`,
          }))}
        />
        {rows.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {rows.length} {rows.length === 1 ? "factura" : "facturas"} · <span className="tabular font-medium text-foreground">{formatBs(total)}</span>
          </p>
        )}
      </div>
      <p className="mb-4 text-sm text-muted-foreground">{copy.description}</p>

      {rows.length === 0 ? (
        <Card>
          <EmptyState icon={copy.icon} title={copy.empty} />
        </Card>
      ) : (
        <ul className="grid gap-3">
          {rows.map((inv) => {
            const collectible = toCollectible(inv);
            const overdue = inv.effective_status === "overdue";
            return (
              <li key={inv.id}>
                <Card className={cn("p-4 sm:p-5", overdue && inv.days_overdue > 30 && "border-destructive/30")}>
                  <div className="flex flex-col gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 flex-1 items-start gap-3">
                      <Avatar name={inv.customer_name} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                          <Link href={`/dashboard/customers/${inv.customer_id}`} className="truncate font-medium hover:underline">
                            {inv.customer_name}
                          </Link>
                          {overdue && <OverdueBadge days={inv.days_overdue} />}
                        </div>
                        <p className="mt-0.5 text-[13px] text-muted-foreground">
                          <a href={`tel:+${formatPhone(inv.customer_phone).replace(/\D/g, "")}`} className="hover:text-foreground hover:underline">
                            {formatPhone(inv.customer_phone)}
                          </a>
                          {" · "}
                          <Link href={`/dashboard/invoices/${inv.id}`} className="hover:text-foreground hover:underline">
                            Factura {inv.invoice_number}
                          </Link>
                        </p>
                        <dl className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-[13px]">
                          <div className="flex gap-1.5">
                            <dt className="text-muted-foreground">Vence:</dt>
                            <dd className={cn(overdue && "text-destructive")}>
                              {formatDate(inv.due_date)} ({dueLabel(inv.due_date, today).toLowerCase()})
                            </dd>
                          </div>
                          <div className="flex gap-1.5">
                            <dt className="text-muted-foreground">Último contacto:</dt>
                            <dd>{inv.last_contact_at ? formatRelative(inv.last_contact_at) : "Nunca"}</dd>
                          </div>
                        </dl>
                      </div>
                      <Money value={inv.outstanding_amount} className="text-base font-semibold md:hidden" />
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
                      <Money value={inv.outstanding_amount} className="hidden w-32 text-right text-base font-semibold md:block" />
                      <ReminderDialog invoices={[collectible]} />
                      <PaymentDialog invoice={collectible} />
                      <NoteDialog customerId={inv.customer_id} invoiceId={inv.id} subtitle={`${inv.customer_name} · ${inv.invoice_number}`} triggerLabel="Nota" />
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
