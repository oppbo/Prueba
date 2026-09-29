"use client";

import { useMemo } from "react";
import { buildItem, orderTotals } from "@/lib/domain/orders";
import { priceFor } from "@/lib/domain/pricing";
import { useLookups } from "@/lib/store/hooks";
import type { Customer, ID, OrderItem, Product } from "@/lib/types";

export interface OrderLine extends OrderItem {
  product: Product;
}

/** Priced lines and totals for the order being built. */
export function useOrderLines(customer: Customer | undefined, quantities: Record<ID, number>, discountPercent: number) {
  const lookups = useLookups();
  return useMemo(() => {
    const lines: OrderLine[] = [];
    if (customer) {
      for (const [productId, qty] of Object.entries(quantities)) {
        const product = lookups.product.get(productId);
        if (!product || qty <= 0) continue;
        lines.push({ ...buildItem(product, qty, priceFor(product, customer.priceList)), product });
      }
    }
    const totals = orderTotals(lines, discountPercent);
    const units = lines.reduce((a, l) => a + l.quantity, 0);
    return { lines, units, ...totals };
  }, [customer, quantities, discountPercent, lookups]);
}
