import * as React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export interface BarListItem {
  key: string;
  label: React.ReactNode;
  value: number;
  display: React.ReactNode;
  secondary?: React.ReactNode;
  href?: string;
  leading?: React.ReactNode;
  color?: string;
}

/** Ranked horizontal bars built in HTML: readable labels, exact values, no legend needed. */
export function BarList({ items, className }: { items: BarListItem[]; className?: string }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  return (
    <ul className={cn("space-y-3", className)}>
      {items.map((item) => {
        const content = (
          <>
            <div className="flex items-center gap-3">
              {item.leading}
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">{item.label}</span>
                  <span className="shrink-0 text-sm font-semibold tabular">{item.display}</span>
                </div>
                <div className="mt-1.5 flex items-center gap-3">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${Math.max((item.value / max) * 100, 2)}%`, backgroundColor: item.color ?? "var(--primary)" }}
                    />
                  </div>
                  {item.secondary && <span className="shrink-0 text-xs text-muted-foreground tabular">{item.secondary}</span>}
                </div>
              </div>
            </div>
          </>
        );
        return (
          <li key={item.key}>
            {item.href ? (
              <Link href={item.href} className="-mx-2 block rounded-md px-2 py-1 transition-colors hover:bg-muted/60">
                {content}
              </Link>
            ) : (
              <div className="py-1">{content}</div>
            )}
          </li>
        );
      })}
    </ul>
  );
}
