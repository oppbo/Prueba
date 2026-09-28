import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { SegmentedNav } from "@/components/shared/segmented-nav";
import { InvoiceStatusBadge } from "@/components/shared/status-badge";
import { InvoiceFormDialog } from "@/components/invoices/invoice-form-dialog";
import { ReminderDialog } from "@/components/collections/reminder-dialog";
import { PaymentDialog } from "@/components/collections/payment-dialog";
import { toCollectible } from "@/components/collections/types";
import { listCustomerOptions } from "@/lib/data/customers";
import { INVOICES_PAGE_SIZE, INVOICE_FILTERS, countInvoicesByFilter, listInvoices } from "@/lib/data/invoices";
import { oneOf, pageParam, withParams } from "@/lib/data/query";
import { dueLabel, formatDate, todayBo } from "@/lib/format";
import { requireSession } from "@/lib/session";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "Facturas" };

const EMPTY: Record<(typeof INVOICE_FILTERS)[number], string> = {
  all: "Todavía no tienes facturas registradas.",
  pending: "Todavía no tienes facturas pendientes.",
  overdue: "¡Todo al día! No tienes facturas vencidas.",
  paid: "Aún no hay facturas pagadas.",
};

export default async function InvoicesPage({ searchParams }: PageProps<"/dashboard/invoices">) {
  const session = await requireSession();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const filter = oneOf(params.status, INVOICE_FILTERS, "all");
  const page = pageParam(params.page);
  const orgId = session.organization.id;
  const [{ rows, total }, counts, customers] = await Promise.all([
    listInvoices({ organizationId: orgId, filter, q, page }),
    countInvoicesByFilter(orgId),
    listCustomerOptions(orgId),
  ]);
  const base = { q: q || undefined, status: filter === "all" ? undefined : filter };
  const today = todayBo();
  const tab = (key: (typeof INVOICE_FILTERS)[number], label: string) => ({
    key,
    label,
    count: counts[key],
    href: withParams("/dashboard/invoices", { ...base, status: key === "all" ? undefined : key }),
  });
  const open = (s: string) => s === "pending" || s === "partially_paid" || s === "overdue";

  return (
    <div>
      <PageHeader
        title="Facturas"
        description="Ventas al crédito, saldos y vencimientos."
        actions={<InvoiceFormDialog customers={customers} defaultOpen={params.new === "1"} />}
      />
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Buscar por número o cliente" label="Buscar facturas" />
        <SegmentedNav
          label="Filtrar facturas"
          active={filter}
          items={[tab("all", "Todas"), tab("pending", "Pendientes"), tab("overdue", "Vencidas"), tab("paid", "Pagadas")]}
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          <EmptyState
            icon={FileText}
            title={q ? "No encontramos facturas con esa búsqueda" : EMPTY[filter]}
            description={!q && filter === "all" ? "Crea una factura o importa tu cartera desde Excel (CSV)." : undefined}
            action={
              !q && filter === "all" ? (
                <div className="flex flex-wrap justify-center gap-2">
                  <InvoiceFormDialog customers={customers} />
                  <Link href="/dashboard/import" className="inline-flex h-9 items-center rounded-md border border-border px-4 text-sm font-medium hover:bg-muted">
                    Importar CSV
                  </Link>
                </div>
              ) : undefined
            }
          />
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Factura</TH>
                    <TH>Cliente</TH>
                    <TH>Emisión</TH>
                    <TH>Vencimiento</TH>
                    <TH className="text-right">Monto</TH>
                    <TH className="text-right">Pendiente</TH>
                    <TH>Estado</TH>
                    <TH className="text-right">Acciones</TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((inv) => (
                    <TR key={inv.id} className={cn(inv.effective_status === "cancelled" && "text-muted-foreground")}>
                      <TD>
                        <Link href={`/dashboard/invoices/${inv.id}`} className="font-medium hover:underline">
                          {inv.invoice_number}
                        </Link>
                      </TD>
                      <TD className="max-w-52">
                        <Link href={`/dashboard/customers/${inv.customer_id}`} className="block truncate hover:underline">
                          {inv.customer_name}
                        </Link>
                      </TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{formatDate(inv.issue_date)}</TD>
                      <TD className="whitespace-nowrap">
                        <span className={cn(inv.effective_status === "overdue" && "text-destructive")}>{formatDate(inv.due_date)}</span>
                        {open(inv.effective_status) && (
                          <p className={cn("text-xs", inv.effective_status === "overdue" ? "text-destructive" : "text-muted-foreground")}>
                            {dueLabel(inv.due_date, today)}
                          </p>
                        )}
                      </TD>
                      <TD className="text-right">
                        <Money value={inv.original_amount} />
                      </TD>
                      <TD className="text-right font-medium">
                        <Money value={inv.effective_status === "cancelled" ? 0 : inv.outstanding_amount} />
                      </TD>
                      <TD>
                        <InvoiceStatusBadge status={inv.effective_status} />
                      </TD>
                      <TD>
                        <div className="flex justify-end gap-1.5">
                          {open(inv.effective_status) && (
                            <>
                              <ReminderDialog invoices={[toCollectible(inv)]} iconOnly />
                              <PaymentDialog invoice={toCollectible(inv)} iconOnly />
                            </>
                          )}
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="divide-y divide-border lg:hidden">
              {rows.map((inv) => (
                <li key={inv.id} className="px-4 py-3.5">
                  <Link href={`/dashboard/invoices/${inv.id}`} className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{inv.customer_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {inv.invoice_number} ·{" "}
                        <span className={cn(inv.effective_status === "overdue" && "text-destructive")}>
                          {open(inv.effective_status) ? dueLabel(inv.due_date, today) : `Vence ${formatDate(inv.due_date)}`}
                        </span>
                      </p>
                    </div>
                    <div className="text-right">
                      <Money value={inv.effective_status === "cancelled" ? 0 : inv.outstanding_amount} className="text-sm font-semibold" />
                      <div className="mt-1">
                        <InvoiceStatusBadge status={inv.effective_status} />
                      </div>
                    </div>
                  </Link>
                  {open(inv.effective_status) && (
                    <div className="mt-3 flex gap-2">
                      <ReminderDialog invoices={[toCollectible(inv)]} />
                      <PaymentDialog invoice={toCollectible(inv)} />
                    </div>
                  )}
                </li>
              ))}
            </ul>
            <Pagination page={page} pageSize={INVOICES_PAGE_SIZE} total={total} hrefFor={(p) => withParams("/dashboard/invoices", base, { page: p })} />
          </>
        )}
      </Card>
    </div>
  );
}
