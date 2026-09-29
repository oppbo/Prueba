import type { Product } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Placeholder thumbnail: brand-colored tile with the product's initials. */
export function ProductThumb({ product, className }: { product: Pick<Product, "name" | "color" | "brand">; className?: string }) {
  const label = product.brand
    .split(/[\s-]+/)
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  return (
    <span
      className={cn("grid size-9 shrink-0 place-items-center rounded-lg text-[11px] font-bold tracking-tight ring-1 ring-inset ring-black/5", className)}
      style={{ backgroundColor: `${product.color}17`, color: product.color }}
      aria-hidden
    >
      {label}
    </span>
  );
}
