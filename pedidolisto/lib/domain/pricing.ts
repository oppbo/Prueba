import type { PriceList, Product } from "@/lib/types";
import { round2 } from "@/lib/utils";

export const PRICE_LISTS: PriceList[] = ["Mayorista A", "Mayorista B", "Minorista"];

export const PRICE_LIST_DESCRIPTION: Record<PriceList, string> = {
  "Mayorista A": "Precio mayorista completo",
  "Mayorista B": "Mayorista con recargo menor",
  Minorista: "Precio base de lista",
};

/** Unit price a customer pays for a product according to their price list. */
export function priceFor(product: Pick<Product, "basePrice" | "wholesalePrice">, priceList: PriceList): number {
  switch (priceList) {
    case "Mayorista A":
      return product.wholesalePrice;
    case "Mayorista B":
      return round2(Math.round((product.wholesalePrice + (product.basePrice - product.wholesalePrice) * 0.35) * 10) / 10);
    default:
      return product.basePrice;
  }
}

export function marginPercent(product: Pick<Product, "wholesalePrice" | "cost">): number {
  if (product.wholesalePrice <= 0) return 0;
  return ((product.wholesalePrice - product.cost) / product.wholesalePrice) * 100;
}
