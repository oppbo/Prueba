"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Check, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/shared/avatar";
import { SearchInput } from "@/components/shared/search-input";
import { formatMoney, formatRelativeDay } from "@/lib/format";
import { useAccounts, useCurrentUser, useData } from "@/lib/store/hooks";
import type { Customer, ID } from "@/lib/types";
import { cn, normalizeText } from "@/lib/utils";

const FEATURED = ["c001", "c002", "c003", "c004", "c005", "c008"];

export function CustomerSnapshot({ customer, onChange }: { customer: Customer; onChange?: () => void }) {
  const accounts = useAccounts();
  const account = accounts.get(customer.id)!;
  const stats = [
    { label: "Deuda", value: formatMoney(account.currentDebt), danger: false },
    { label: "Crédito disponible", value: customer.creditLimit > 0 ? formatMoney(account.availableCredit) : "Solo contado", danger: false },
    { label: "Último pedido", value: formatRelativeDay(account.lastOrderDate), danger: false },
    { label: "Lista de precios", value: customer.priceList, danger: false },
  ];
  return (
    <div className="rounded-xl border border-primary/30 bg-primary-soft/40 p-4">
      <div className="flex items-center gap-3">
        <Avatar name={customer.businessName} className="size-10" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{customer.businessName}</p>
          <p className="truncate text-sm text-muted-foreground">
            {customer.ownerName} · {customer.zone}
          </p>
        </div>
        {onChange && (
          <Button variant="ghost" size="sm" onClick={onChange}>
            Cambiar
          </Button>
        )}
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label}>
            <dt className="text-xs text-muted-foreground">{s.label}</dt>
            <dd className="mt-0.5 text-[15px] font-semibold tabular">{s.value}</dd>
          </div>
        ))}
      </dl>
      {account.overdueDebt > 0 && (
        <p className="mt-3 flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-destructive-soft-foreground ring-1 ring-destructive/15">
          <AlertTriangle className="size-4 shrink-0" />
          Tiene {formatMoney(account.overdueDebt)} vencidos hace {account.oldestOverdueDays} días.
        </p>
      )}
    </div>
  );
}

export function CustomerStep({
  customerId,
  onSelect,
  onContinue,
}: {
  customerId: ID | "";
  onSelect: (id: ID | "") => void;
  onContinue: () => void;
}) {
  const data = useData();
  const accounts = useAccounts();
  const user = useCurrentUser();
  const [query, setQuery] = useState("");
  const selected = data.customers.find((c) => c.id === customerId);

  const results = useMemo(() => {
    const q = normalizeText(query.trim());
    const active = data.customers.filter((c) => c.status !== "inactive");
    if (!q) {
      const featured = FEATURED.map((id) => active.find((c) => c.id === id)).filter(Boolean) as Customer[];
      // Sellers see the customers of their own route first.
      return user.salespersonId ? [...featured].sort((a, b) => Number(b.salespersonId === user.salespersonId) - Number(a.salespersonId === user.salespersonId)) : featured;
    }
    const digits = q.replace(/\D/g, "");
    return active
      .filter((c) => normalizeText(`${c.businessName} ${c.ownerName} ${c.zone}`).includes(q) || (digits.length >= 3 && c.phone.includes(digits)))
      .slice(0, 10);
  }, [data.customers, query, user.salespersonId]);

  if (selected) {
    return (
      <div className="space-y-4">
        <CustomerSnapshot customer={selected} onChange={() => onSelect("")} />
        <Button size="xl" className="hidden w-full lg:flex" onClick={onContinue}>
          Continuar con productos <ChevronRight />
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <SearchInput value={query} onChange={setQuery} placeholder="Buscar cliente por nombre, zona o celular..." size="lg" autoFocus />
      <p className="px-1 text-xs font-medium text-muted-foreground">{query ? `${results.length} resultados` : "Clientes frecuentes"}</p>
      <ul className="overflow-hidden rounded-xl border border-border bg-card">
        {results.map((c) => {
          const a = accounts.get(c.id)!;
          return (
            <li key={c.id} className="border-b border-border last:border-0">
              <button
                type="button"
                onClick={() => onSelect(c.id)}
                className={cn("flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-muted/60 active:bg-muted")}
              >
                <Avatar name={c.businessName} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15px] font-medium">{c.businessName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {c.ownerName} · {c.zone}
                  </span>
                </span>
                {a.overdueDebt > 0 ? (
                  <span className="shrink-0 text-xs font-medium text-destructive tabular">{formatMoney(a.overdueDebt)} vencido</span>
                ) : a.currentDebt > 0 ? (
                  <span className="shrink-0 text-xs text-muted-foreground tabular">Debe {formatMoney(a.currentDebt)}</span>
                ) : (
                  <Check className="size-4 shrink-0 text-success" aria-label="Sin deuda" />
                )}
              </button>
            </li>
          );
        })}
        {results.length === 0 && <li className="px-4 py-8 text-center text-sm text-muted-foreground">No encontramos clientes con “{query}”.</li>}
      </ul>
    </div>
  );
}
