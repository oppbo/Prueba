import type {
  CustomerStatus,
  InventoryMovementType,
  OrderChannel,
  OrderStatus,
  PaymentMethod,
  PaymentType,
  Role,
  StockStatus,
} from "./types";

export type Tone = "neutral" | "success" | "warning" | "danger" | "info" | "brand" | "violet";

export const ORDER_STATUS: Record<OrderStatus, { label: string; tone: Tone }> = {
  pending: { label: "Pendiente", tone: "warning" },
  confirmed: { label: "Confirmado", tone: "info" },
  preparing: { label: "Preparando", tone: "violet" },
  ready: { label: "Listo", tone: "brand" },
  dispatched: { label: "Despachado", tone: "neutral" },
  delivered: { label: "Entregado", tone: "success" },
  cancelled: { label: "Cancelado", tone: "danger" },
};

/** Forward flow used by the status timeline (cancelled is off-flow). */
export const ORDER_FLOW: OrderStatus[] = ["pending", "confirmed", "preparing", "ready", "dispatched", "delivered"];

export const ORDER_FLOW_LABELS: Record<OrderStatus, string> = {
  pending: "Pedido recibido",
  confirmed: "Confirmado",
  preparing: "Preparando",
  ready: "Listo para despacho",
  dispatched: "Despachado",
  delivered: "Entregado",
  cancelled: "Cancelado",
};

export const PAYMENT_TYPE: Record<PaymentType, { label: string; tone: Tone }> = {
  cash: { label: "Contado", tone: "neutral" },
  credit: { label: "Crédito", tone: "info" },
};

export const PAYMENT_METHOD: Record<PaymentMethod, string> = {
  cash: "Efectivo",
  transfer: "Transferencia",
  deposit: "Depósito",
  other: "Otro",
};

export const ORDER_CHANNEL: Record<OrderChannel, string> = {
  seller: "Vendedor",
  whatsapp: "WhatsApp",
  phone: "Teléfono",
};

export const STOCK_STATUS: Record<StockStatus, { label: string; tone: Tone }> = {
  normal: { label: "Normal", tone: "success" },
  low: { label: "Stock bajo", tone: "warning" },
  out: { label: "Sin stock", tone: "danger" },
};

export const CUSTOMER_STATUS: Record<CustomerStatus, { label: string; tone: Tone }> = {
  active: { label: "Activo", tone: "success" },
  inactive: { label: "Inactivo", tone: "neutral" },
  blocked: { label: "Bloqueado", tone: "danger" },
};

export const MOVEMENT_TYPE: Record<InventoryMovementType, string> = {
  in: "Ingreso",
  out: "Salida",
  adjustment: "Ajuste",
  sale: "Venta",
  return: "Devolución",
};

export const ROLE_LABEL: Record<Role, string> = {
  owner: "Dueño",
  seller: "Vendedor",
  warehouse: "Almacén",
};
