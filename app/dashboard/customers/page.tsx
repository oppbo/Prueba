import type { Metadata } from "next";
import Link from "next/link";
import { ChevronRight, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { Money } from "@/components/shared/money";
import { PageHeader } from "@/components/shared/page-header";
import { Pagination } from "@/components/shared/pagination";
import { SearchInput } from "@/components/shared/search-input";
import { SegmentedNav } from "@/components/shared/segmented-nav";
import { CustomerStatusBadge } from "@/components/shared/status-badge";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { CUSTOMERS_PAGE_SIZE, countCustomersByStatus, listCustomers } from "@/lib/data/customers";
import { oneOf, pageParam, withParams } from "@/lib/data/query";
import { formatPhone } from "@/lib/phone";
import { formatRelative } from "@/lib/format";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Clientes" };

const STATUSES = ["all", "active", "inactive"] as const;

export default async function CustomersPage({ searchParams }: PageProps<"/dashboard/customers">) {
  const session = await requireSession();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q : "";
  const status = oneOf(params.status, STATUSES, "all");
  const page = pageParam(params.page);
  const [{ rows, total }, counts] = await Promise.all([
    listCustomers({ organizationId: session.organization.id, q, status, page }),
    countCustomersByStatus(session.organization.id),
  ]);
  const base = { q: q || undefined, status: status === "all" ? undefined : status };
  const hasFilters = Boolean(q) || status !== "all";

  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Quién te debe, cuánto y cuándo fue el último contacto."
        actions={<CustomerFormDialog defaultOpen={params.new === "1"} />}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <SearchInput placeholder="Buscar por nombre, NIT o teléfono" label="Buscar clientes" />
        <SegmentedNav
          label="Filtrar por estado"
          active={status}
          items={[
            { key: "all", label: "Todos", count: counts.all, href: withParams("/dashboard/customers", { ...base, status: undefined }) },
            { key: "active", label: "Activos", count: counts.active, href: withParams("/dashboard/customers", { ...base, status: "active" }) },
            { key: "inactive", label: "Inactivos", count: counts.inactive, href: withParams("/dashboard/customers", { ...base, status: "inactive" }) },
          ]}
        />
      </div>

      <Card className="overflow-hidden">
        {rows.length === 0 ? (
          hasFilters ? (
            <EmptyState icon={Users} title="No encontramos clientes con ese filtro" description="Prueba con otro nombre, NIT o teléfono." />
          ) : (
            <EmptyState
              icon={Users}
              title="Agrega tu primer cliente para empezar a gestionar tus cobranzas"
              description="También puedes importar tu cartera completa desde un archivo CSV."
              action={<CustomerFormDialog />}
            />
          )
        ) : (
          <>
            <div className="hidden lg:block">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Cliente</TH>
                    <TH>Teléfono</TH>
                    <TH>NIT</TH>
                    <TH className="text-right">Facturas pendientes</TH>
                    <TH className="text-right">Saldo</TH>
                    <TH>Estado</TH>
                    <TH>Último contacto</TH>
                    <TH>
                      <span className="sr-only">Acciones</span>
                    </TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map((c) => (
                    <TR key={c.id} className="group relative">
                      <TD className="max-w-64">
                        <div className="flex items-center gap-3">
                          <Avatar name={c.name} />
                          <div className="min-w-0">
                            <Link href={`/dashboard/customers/${c.id}`} className="block truncate font-medium after:absolute after:inset-0">
                              {c.name}
                            </Link>
                            {c.business_name && <p className="truncate text-xs text-muted-foreground">{c.business_name}</p>}
                          </div>
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{formatPhone(c.phone)}</TD>
                      <TD className="text-muted-foreground">{c.nit ?? "—"}</TD>
                      <TD className="tabular text-right">{c.open_invoices}</TD>
                      <TD className="text-right">
                        <Money value={c.balance} className="font-medium" />
                        {c.overdue_balance > 0 && (
                          <p className="tabular text-xs text-destructive">
                            <Money value={c.overdue_balance} /> vencido
                          </p>
                        )}
                      </TD>
                      <TD>
                        <CustomerStatusBadge status={c.status} />
                      </TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{formatRelative(c.last_contact_at)}</TD>
                      <TD className="text-right">
                        <ChevronRight className="ml-auto size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="divide-y divide-border lg:hidden">
              {rows.map((c) => (
                <li key={c.id}>
                  <Link href={`/dashboard/customers/${c.id}`} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50">
                    <Avatar name={c.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.name}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatPhone(c.phone)} · {c.open_invoices} {c.open_invoices === 1 ? "factura" : "facturas"}
                      </p>
                    </div>
                    <div className="text-right">
                      <Money value={c.balance} className="text-sm font-semibold" />
                      {c.overdue_balance > 0 ? (
                        <p className="text-xs text-destructive">Con deuda vencida</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">{c.status === "inactive" ? "Inactivo" : "Al día"}</p>
                      )}
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={page} pageSize={CUSTOMERS_PAGE_SIZE} total={total} hrefFor={(p) => withParams("/dashboard/customers", base, { page: p })} />
          </>
        )}
      </Card>
    </div>
  );
}
