import Link from "next/link";
import { cn } from "@/lib/utils";

export type SegmentItem = { key: string; label: string; href: string; count?: number };

/** URL-driven tabs: works without JS, shareable, and keeps server rendering. */
export function SegmentedNav({ items, active, label }: { items: SegmentItem[]; active: string; label: string }) {
  return (
    <nav aria-label={label} className="-mx-1 overflow-x-auto px-1">
      <ul className="inline-flex min-w-max gap-1 rounded-lg border border-border bg-muted/60 p-1">
        {items.map((item) => {
          const isActive = item.key === active;
          return (
            <li key={item.key}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                scroll={false}
                className={cn(
                  "inline-flex h-8 items-center gap-2 rounded-md px-3 text-[13px] font-medium whitespace-nowrap transition-colors",
                  isActive ? "bg-card text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
                {typeof item.count === "number" && (
                  <span
                    className={cn(
                      "tabular rounded-full px-1.5 text-[11px] leading-5",
                      isActive ? "bg-primary-soft text-primary-soft-foreground" : "bg-card text-muted-foreground",
                    )}
                  >
                    {item.count}
                  </span>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
