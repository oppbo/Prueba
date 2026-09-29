import type { Product, StockStatus } from "@/lib/types";

export function stockStatus(product: Pick<Product, "stock" | "minimumStock">): StockStatus {
  if (product.stock <= 0) return "out";
  if (product.stock <= product.minimumStock) return "low";
  return "normal";
}

export function inventoryValue(products: Product[]): number {
  return products.reduce((acc, p) => acc + Math.max(p.stock, 0) * p.cost, 0);
}
