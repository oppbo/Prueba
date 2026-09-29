"use client";

import { useMemo } from "react";
import type { Customer, DemoData, ID, Product, Role, Salesperson } from "@/lib/types";
import { computeAllAccounts, type AccountDetail } from "@/lib/domain/accounts";
import { useDemoStore } from "./demo-store";

/** Demo data; only use inside <AppShell>, which renders children after hydration. */
export function useData(): DemoData {
  const data = useDemoStore((s) => s.data);
  if (!data) throw new Error("useData() se usó antes de cargar la demo.");
  return data;
}

export function useRole(): Role {
  return useDemoStore((s) => s.role);
}

export interface Lookups {
  product: Map<ID, Product>;
  customer: Map<ID, Customer>;
  salesperson: Map<ID, Salesperson>;
}

export function useLookups(): Lookups {
  const data = useData();
  const { products, customers, salespeople } = data;
  return useMemo(
    () => ({
      product: new Map(products.map((p) => [p.id, p])),
      customer: new Map(customers.map((c) => [c.id, c])),
      salesperson: new Map(salespeople.map((s) => [s.id, s])),
    }),
    [products, customers, salespeople],
  );
}

let accountsCache: { key: unknown[]; value: Map<ID, AccountDetail> } | null = null;

/** Derived balances for every customer, cached until orders/payments/customers change. */
export function getAccounts(data: DemoData): Map<ID, AccountDetail> {
  const key = [data.orders, data.payments, data.customers, data.openingBalances, new Date().toDateString()];
  if (accountsCache && accountsCache.key.every((k, i) => k === key[i])) return accountsCache.value;
  const value = computeAllAccounts(data);
  accountsCache = { key, value };
  return value;
}

export function useAccounts(): Map<ID, AccountDetail> {
  const data = useData();
  return getAccounts(data);
}

/** The logged-in demo user for the current role. */
export const DEMO_USERS: Record<Role, { name: string; title: string; salespersonId?: ID }> = {
  owner: { name: "Marcelo Rojas", title: "Administrador" },
  seller: { name: "Carlos Mendoza", title: "Vendedor", salespersonId: "s1" },
  warehouse: { name: "Luis Choque", title: "Encargado de almacén" },
};

export function useCurrentUser() {
  const role = useRole();
  return { role, ...DEMO_USERS[role] };
}
