import type { DemoData, ID, InventoryMovement, Order, OrderChannel, OrderStatus, PaymentType } from "@/lib/types";
import { buildItem, formatOrderNumber, orderHistory, orderTotals, statusEventMessage } from "@/lib/domain/orders";
import { priceFor } from "@/lib/domain/pricing";
import { formatMoney } from "@/lib/format";
import { newId } from "./ids";

export interface CreateOrderInput {
  customerId: ID;
  salespersonId?: ID;
  items: { productId: ID; quantity: number }[];
  discountPercent: number;
  paymentType: PaymentType;
  channel: OrderChannel;
  notes?: string;
}

export class ServiceError extends Error {}

/** Creates a confirmed order, reserves stock and notifies the warehouse. */
export function createOrder(data: DemoData, input: CreateOrderInput, now = new Date()): { data: DemoData; order: Order } {
  const customer = data.customers.find((c) => c.id === input.customerId);
  if (!customer) throw new ServiceError("Selecciona un cliente válido.");
  const lines = input.items.filter((i) => i.quantity > 0);
  if (lines.length === 0) throw new ServiceError("Agrega al menos un producto al pedido.");

  const products = new Map(data.products.map((p) => [p.id, p]));
  const items = lines.map((line) => {
    const product = products.get(line.productId);
    if (!product) throw new ServiceError("Uno de los productos ya no existe.");
    return buildItem(product, line.quantity, priceFor(product, customer.priceList));
  });
  const totals = orderTotals(items, input.discountPercent);
  const salespersonId = input.salespersonId ?? customer.salespersonId;
  const salesperson = data.salespeople.find((s) => s.id === salespersonId);
  const number = formatOrderNumber(data.nextOrderNumber);
  const createdAt = now.toISOString();
  const confirmedAt = new Date(now.getTime() + 1000).toISOString();

  const order: Order = {
    id: newId("o"),
    number,
    customerId: customer.id,
    salespersonId,
    items,
    ...totals,
    paymentType: input.paymentType,
    status: "confirmed",
    channel: input.channel,
    createdAt,
    updatedAt: confirmedAt,
    deliveryDate: new Date(now.getTime() + 86_400_000).toISOString(),
    notes: input.notes?.trim() || undefined,
    stockReserved: true,
    history: [
      {
        at: createdAt,
        status: "pending",
        message:
          input.channel === "whatsapp"
            ? `Pedido generado desde WhatsApp con el asistente por ${salesperson?.name ?? "el vendedor"}`
            : `Pedido creado por ${salesperson?.name ?? "el vendedor"}`,
      },
      { at: confirmedAt, status: "confirmed", message: "Pedido confirmado y enviado a almacén" },
    ],
  };

  const movements: InventoryMovement[] = [];
  const nextProducts = data.products.map((p) => {
    const qty = items.filter((i) => i.productId === p.id).reduce((acc, i) => acc + i.quantity, 0);
    if (!qty) return p;
    const stock = p.stock - qty;
    movements.push({ id: newId("mv"), productId: p.id, type: "sale", quantity: -qty, stockAfter: stock, reason: `Reserva por pedido ${number}`, date: createdAt });
    return { ...p, stock };
  });

  return {
    order,
    data: {
      ...data,
      orders: [...data.orders, order],
      products: nextProducts,
      inventoryMovements: [...movements, ...data.inventoryMovements],
      nextOrderNumber: data.nextOrderNumber + 1,
      notifications: [
        {
          id: newId("n"),
          kind: "order" as const,
          title: `Nuevo pedido ${number} · ${formatMoney(totals.total)}`,
          description: `${customer.businessName} · enviado a almacén para preparar.`,
          href: `/pedidos/${order.id}`,
          date: createdAt,
          read: false,
        },
        ...data.notifications,
      ].slice(0, 40),
    },
  };
}

/** Moves an order to a new status and records it in the order history. */
export function updateOrderStatus(data: DemoData, orderId: ID, status: OrderStatus, now = new Date()): DemoData {
  const order = data.orders.find((o) => o.id === orderId);
  if (!order) throw new ServiceError("Pedido no encontrado.");
  if (order.status === status) return data;
  const salesperson = data.salespeople.find((s) => s.id === order.salespersonId);
  const history = [...orderHistory(order, salesperson?.name ?? "Vendedor"), { at: now.toISOString(), status, message: statusEventMessage(status) }];

  let products = data.products;
  let inventoryMovements = data.inventoryMovements;
  if (status === "cancelled" && order.stockReserved) {
    // Release reserved stock.
    const added: typeof inventoryMovements = [];
    products = data.products.map((p) => {
      const qty = order.items.filter((i) => i.productId === p.id).reduce((acc, i) => acc + i.quantity, 0);
      if (!qty) return p;
      added.push({ id: newId("mv"), productId: p.id, type: "return", quantity: qty, stockAfter: p.stock + qty, reason: `Pedido ${order.number} cancelado`, date: now.toISOString() });
      return { ...p, stock: p.stock + qty };
    });
    inventoryMovements = [...added, ...inventoryMovements];
  }

  return {
    ...data,
    products,
    inventoryMovements,
    orders: data.orders.map((o) => (o.id === orderId ? { ...o, status, updatedAt: now.toISOString(), history } : o)),
  };
}
