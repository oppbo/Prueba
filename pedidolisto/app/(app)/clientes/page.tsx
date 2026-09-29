"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Plus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { NativeSelect } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { FilterChips } from "@/components/shared/filter-chips";
import { EmptyState } from "@/components/shared/empty-state";
import { Avatar } from "@/components/shared/avatar";
import { CustomerStatusBadge } from "@/components/shared/status-badges";
import { Pagination, paginate } from "@/components/shared/pagination";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { DebtCell } from "@/components/customers/debt-cell";
import { formatMoney, formatRelativeDay } from "@/lib/format";
import { useAccounts, useCurrentUser, useData, useLookups } from "@/lib/store/hooks";
import { normalizeText } from "@/lib/utils";

type DebtFilter = "all" | "debt" | "overdue" | "clear";
const PAGE_SIZE = 25;

export default function CustomersPage() {
  const data = useData();
  const accounts = useAccounts();
  const lookups = useLookups();
  const user = useCurrentUser();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<DebtFilter>("all");
  const [seller, setSeller] = useState(user.salespersonId ?? "");
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);

  // Rank customers by what they bought in the last 30 days (best customers first).
  const [now] = useState(() => Date.now());
  const volume = useMemo(() => {
    const from = now - 30 * 86_400_000;
    const map = new Map<string, number>();
    for (const o of data.orders) {
      if (o.status === "cancelled" || new Date(o.createdAt).getTime() < from) continue;
      map.set(o.customerId, (map.get(o.customerId) ?? 0) + o.total);
    }
    return map;
  }, [data.orders, now]);

  const rows = useMemo(() => {
    const q = normalizeText(query.trim());
    const digits = q.replace(/\D/g, "");
    return data.customers
      .filter((c) => !seller || c.salespersonId === seller)
      .filter((c) => !q || normalizeText(`${c.businessName} ${c.ownerName} ${c.zone}`).includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
      .map((c) => ({ customer: c, account: accounts.get(c.id)! }))
      .sort((a, b) => (volume.get(b.customer.id) ?? 0) - (volume.get(a.customer.id) ?? 0));
  }, [data.customers, accounts, query, seller, volume]);

  const counts = {
    all: rows.length,
    debt: rows.filter((r) => r.account.currentDebt > 0).length,
    overdue: rows.filter((r) => r.account.overdueDebt > 0).length,
    clear: rows.filter((r) => r.account.currentDebt <= 0).length,
  };
  const filtered = rows.filter((r) =>
    filter === "debt" ? r.account.currentDebt > 0 : filter === "overdue" ? r.account.overdueDebt > 0 : filter === "clear" ? r.account.currentDebt <= 0 : true,
  );
  if (filter === "debt" || filter === "overdue") filtered.sort((a, b) => b.account.overdueDebt - a.account.overdueDebt || b.account.currentDebt - a.account.currentDebt);
  const visible = paginate(filtered, page, PAGE_SIZE);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Clientes"
        description="Administra clientes, crédito e historial de compras."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> Nuevo cliente
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row">
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Buscar por nombre, teléfono o zona..." className="sm:max-w-md sm:flex-1" />
        <NativeSelect value={seller} onChange={(e) => { setSeller(e.target.value); setPage(1); }} aria-label="Vendedor" className="sm:w-52">
          <option value="">{user.role === "seller" ? "Todos los clientes" : "Todos los vendedores"}</option>
          {data.salespeople.map((s) => (
            <option key={s.id} value={s.id}>
              {s.id === user.salespersonId ? "Mis clientes" : s.name}
            </option>
          ))}
        </NativeSelect>
      </div>
      <FilterChips
        value={filter}
        onChange={(v) => { setFilter(v); setPage(1); }}
        options={[
          { value: "all", label: "Todos", count: counts.all },
          { value: "debt", label: "Con deuda", count: counts.debt },
          { value: "overdue", label: "Deuda vencida", count: counts.overdue },
          { value: "clear", label: "Sin deuda", count: counts.clear },
        ]}
      />

      <Card className="overflow-hidden">
        {filtered.length === 0 ? (
          <EmptyState icon={Users} title="No encontramos clientes" description="Revisa la búsqueda o crea un cliente nuevo." action={<Button variant="secondary" onClick={() => setCreating(true)}><Plus /> Nuevo cliente</Button>} />
        ) : (
          <>
            <div className="hidden md:block">
              <Table>
                <THead>
                  <tr>
                    <TH>Cliente</TH>
                    <TH>Zona</TH>
                    <TH className="hidden lg:table-cell">Vendedor</TH>
                    <TH>Último pedido</TH>
                    <TH className="text-right">Deuda</TH>
                    <TH className="hidden text-right lg:table-cell">Crédito disponible</TH>
                    <TH>Estado</TH>
                  </tr>
                </THead>
                <TBody>
                  {visible.map(({ customer: c, account: a }) => (
                    <TR key={c.id} className="cursor-pointer" onClick={() => router.push(`/clientes/${c.id}`)}>
                      <TD>
                        <div className="flex items-center gap-3">
                          <Avatar name={c.businessName} />
                          <div className="min-w-0">
                            <Link href={`/clientes/${c.id}`} className="block truncate font-medium hover:text-primary" onClick={(e) => e.stopPropagation()}>
                              {c.businessName}
                            </Link>
                            <p className="truncate text-xs text-muted-foreground">{c.ownerName}</p>
                          </div>
                        </div>
                      </TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{c.zone}</TD>
                      <TD className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{lookups.salesperson.get(c.salespersonId)?.name}</TD>
                      <TD className="whitespace-nowrap text-muted-foreground">{formatRelativeDay(a.lastOrderDate)}</TD>
                      <TD className="text-right">
                        <DebtCell account={a} />
                      </TD>
                      <TD className="hidden text-right whitespace-nowrap text-muted-foreground tabular lg:table-cell">
                        {c.creditLimit > 0 ? formatMoney(a.availableCredit) : <span className="text-xs">Solo contado</span>}
                      </TD>
                      <TD>
                        <CustomerStatusBadge status={c.status} />
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </div>
            <ul className="divide-y divide-border md:hidden">
              {visible.map(({ customer: c, account: a }) => (
                <li key={c.id}>
                  <Link href={`/clientes/${c.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted/60">
                    <Avatar name={c.businessName} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{c.businessName}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {c.zone} · {formatRelativeDay(a.lastOrderDate)}
                      </p>
                    </div>
                    <DebtCell account={a} />
                    <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={page} pageSize={PAGE_SIZE} total={filtered.length} onPageChange={setPage} />
          </>
        )}
      </Card>
      <CustomerFormDialog open={creating} onOpenChange={setCreating} />
    </div>
  );
}
