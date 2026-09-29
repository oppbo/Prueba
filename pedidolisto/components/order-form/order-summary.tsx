"use client";

import { ShoppingCart, X } from "lucide-react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { ID } from "@/lib/types";
import type { OrderLine } from "./use-order-lines";

export const DISCOUNTS = [0, 2, 3, 5];

export function OrderSummary({
  lines,
  subtotal,
  discount,
  total,
  discountPercent,
  onDiscount,
  onRemove,
  className,
}: {
  lines: OrderLine[];
  subtotal: number;
  discount: number;
  total: number;
  discountPercent: number;
  onDiscount: (value: number) => void;
  onRemove?: (productId: ID) => void;
  className?: string;
}) {
  return (
    <div className={className}>
      {lines.length === 0 ? (
        <div className="flex flex-col items-center py-8 text-center text-sm text-muted-foreground">
          <ShoppingCart className="mb-2 size-6" />
          Aún no agregaste productos
        </div>
      ) : (
        <ul className="space-y-2">
          {lines.map((l) => (
            <li key={l.productId} className="group flex items-start gap-2 text-sm">
              <span className="w-8 shrink-0 text-right font-semibold tabular">{l.quantity}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate">{l.product.shortName}</span>
                <span className="text-xs text-muted-foreground tabular">× {formatMoney(l.unitPrice)}</span>
              </span>
              <span className="shrink-0 font-medium tabular">{formatMoney(l.subtotal)}</span>
              {onRemove && (
                <button type="button" onClick={() => onRemove(l.productId)} className="mt-0.5 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={`Quitar ${l.product.shortName}`}>
                  <X className="size-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
      <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Subtotal</span>
          <span className="tabular">{formatMoney(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-muted-foreground">Descuento</span>
          <div className="flex items-center gap-1">
            {DISCOUNTS.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => onDiscount(d)}
                className={cn(
                  "h-6 rounded-md px-1.5 text-xs font-medium tabular transition-colors",
                  discountPercent === d ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted",
                )}
              >
                {d}%
              </button>
            ))}
          </div>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-success">
            <span>Descuento {discountPercent}%</span>
            <span className="tabular">−{formatMoney(discount)}</span>
          </div>
        )}
        <div className="flex items-baseline justify-between border-t border-border pt-3">
          <span className="font-medium">Total</span>
          <span className="text-xl font-semibold tracking-tight tabular">{formatMoney(total)}</span>
        </div>
      </div>
    </div>
  );
}
