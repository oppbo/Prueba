import type { DemoData, ID, InventoryMovementType } from "@/lib/types";
import { newId } from "./ids";
import { ServiceError } from "./orders";

export interface AdjustInventoryInput {
  productId: ID;
  type: Extract<InventoryMovementType, "in" | "out" | "adjustment">;
  /** For in/out: units moved. For adjustment: the counted stock. */
  quantity: number;
  reason: string;
}

export function adjustInventory(data: DemoData, input: AdjustInventoryInput, now = new Date()): DemoData {
  const product = data.products.find((p) => p.id === input.productId);
  if (!product) throw new ServiceError("Producto no encontrado.");
  if (!Number.isFinite(input.quantity) || input.quantity < 0) throw new ServiceError("Ingresa una cantidad válida.");
  let delta: number;
  if (input.type === "in") delta = input.quantity;
  else if (input.type === "out") delta = -input.quantity;
  else delta = input.quantity - product.stock;
  const stock = product.stock + delta;
  if (stock < 0) throw new ServiceError(`No hay suficiente stock. Disponible: ${product.stock}.`);

  return {
    ...data,
    products: data.products.map((p) => (p.id === product.id ? { ...p, stock } : p)),
    inventoryMovements: [
      { id: newId("mv"), productId: product.id, type: input.type, quantity: delta, stockAfter: stock, reason: input.reason.trim() || "Sin motivo", date: now.toISOString() },
      ...data.inventoryMovements,
    ],
  };
}
