import type { Order, OrderEvent, OrderItem, OrderStatus, Product } from "@/lib/types";
import { ORDER_FLOW, ORDER_FLOW_LABELS } from "@/lib/labels";
import { round2, sum } from "@/lib/utils";

export function lineSubtotal(quantity: number, unitPrice: number): number {
  return round2(quantity * unitPrice);
}

export function orderTotals(items: Pick<OrderItem, "subtotal">[], discountPercent = 0) {
  const subtotal = round2(sum(items, (i) => i.subtotal));
  const discount = round2((subtotal * discountPercent) / 100);
  return { subtotal, discount, total: round2(subtotal - discount) };
}

export function orderUnits(order: Pick<Order, "items">): number {
  return sum(order.items, (i) => i.quantity);
}

export function formatOrderNumber(n: number): string {
  return `PED-${String(n).padStart(4, "0")}`;
}

/** Statuses the order can move to from the current one (demo allows skipping forward). */
export function nextStatuses(status: OrderStatus): OrderStatus[] {
  if (status === "cancelled" || status === "delivered") return [];
  const index = ORDER_FLOW.indexOf(status);
  return [...ORDER_FLOW.slice(index + 1), "cancelled"];
}

/** Orders that still consume warehouse work. */
export function isOpenOrder(order: Pick<Order, "status">): boolean {
  return order.status !== "delivered" && order.status !== "cancelled";
}

/** Stock-affecting statuses: everything except cancelled. */
export function countsForSales(order: Pick<Order, "status">): boolean {
  return order.status !== "cancelled";
}

/**
 * Seed orders do not store their history; derive a believable, deterministic timeline
 * between createdAt and updatedAt from the status the order reached.
 */
export function orderHistory(order: Order, salespersonName: string): OrderEvent[] {
  if (order.history && order.history.length > 0) return order.history;
  const created = new Date(order.createdAt).getTime();
  const updated = Math.max(new Date(order.updatedAt).getTime(), created);
  const reached = order.status === "cancelled" ? 1 : ORDER_FLOW.indexOf(order.status);
  const steps = ORDER_FLOW.slice(1, reached + 1);
  const events: OrderEvent[] = [
    {
      at: order.createdAt,
      status: "pending",
      message:
        order.channel === "whatsapp"
          ? `Pedido recibido por WhatsApp y registrado por ${salespersonName}`
          : order.channel === "phone"
            ? `Pedido recibido por teléfono, registrado por ${salespersonName}`
            : `Pedido creado por ${salespersonName}`,
    },
  ];
  steps.forEach((status, i) => {
    const fraction = steps.length === 1 ? 1 : (i + 1) / steps.length;
    const at = new Date(i === 0 ? Math.min(created + 2 * 60_000, updated) : created + (updated - created) * fraction);
    events.push({ at: at.toISOString(), status, message: statusEventMessage(status) });
  });
  if (order.status === "cancelled") {
    events.push({ at: order.updatedAt, status: "cancelled", message: "Pedido cancelado" });
  }
  return events;
}

export function statusEventMessage(status: OrderStatus): string {
  switch (status) {
    case "confirmed":
      return "Pedido confirmado";
    case "preparing":
      return "Enviado a almacén · preparación iniciada";
    case "ready":
      return "Pedido preparado y listo para despacho";
    case "dispatched":
      return "Pedido despachado con el camión de reparto";
    case "delivered":
      return "Pedido entregado al cliente";
    case "cancelled":
      return "Pedido cancelado";
    default:
      return ORDER_FLOW_LABELS[status];
  }
}

export function buildItem(product: Pick<Product, "id">, quantity: number, unitPrice: number): OrderItem {
  return { productId: product.id, quantity, unitPrice, subtotal: lineSubtotal(quantity, unitPrice) };
}
