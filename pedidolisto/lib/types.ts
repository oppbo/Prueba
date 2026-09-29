/**
 * Domain types for PedidoListo. These mirror the future database schema, so the
 * local demo store can later be swapped for Supabase / a REST API.
 * All dates are ISO-8601 strings; all amounts are bolivianos (Bs).
 */

export type ID = string;

export type Role = "owner" | "seller" | "warehouse";

export type ProductCategory = "Bebidas" | "Alimentos" | "Limpieza" | "Lácteos" | "Hogar";

export type ProductStatus = "active" | "inactive";

export interface Product {
  id: ID;
  sku: string;
  name: string;
  /** Short name used in warehouse lists and chat parsing, e.g. "Coca-Cola 2L". */
  shortName: string;
  category: ProductCategory;
  brand: string;
  basePrice: number;
  wholesalePrice: number;
  cost: number;
  stock: number;
  minimumStock: number;
  /** Selling unit, e.g. "Paquete x6", "Caja x12", "Unidad". */
  unit: string;
  status: ProductStatus;
  /** Hex color used for the product placeholder thumbnail. */
  color: string;
}

export type StockStatus = "normal" | "low" | "out";

export type PriceList = "Minorista" | "Mayorista A" | "Mayorista B";

export type CustomerType = "Tienda de barrio" | "Minimarket" | "Supermercado" | "Mayorista" | "Kiosco" | "Restaurante";

export type CustomerStatus = "active" | "inactive" | "blocked";

export interface Customer {
  id: ID;
  businessName: string;
  ownerName: string;
  phone: string;
  zone: string;
  address: string;
  customerType: CustomerType;
  priceList: PriceList;
  creditLimit: number;
  /** Days of credit granted before a credit sale becomes overdue. */
  creditDays: number;
  salespersonId: ID;
  status: CustomerStatus;
  notes: string;
  createdAt: string;
}

/** Derived account state for a customer (computed from orders + payments). */
export interface CustomerAccount {
  customerId: ID;
  currentDebt: number;
  overdueDebt: number;
  availableCredit: number;
  nextDueDate: string | null;
  nextDueAmount: number;
  oldestOverdueDays: number;
  lastOrderDate: string | null;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
}

export interface Salesperson {
  id: ID;
  name: string;
  phone: string;
  zones: string[];
  color: string;
  /** Visits without purchase registered today (demo figure). */
  extraVisitsToday: number;
  dailyTarget: number;
}

export type OrderStatus = "pending" | "confirmed" | "preparing" | "ready" | "dispatched" | "delivered" | "cancelled";

export type PaymentType = "cash" | "credit";

export type OrderChannel = "seller" | "whatsapp" | "phone";

export interface OrderItem {
  productId: ID;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface OrderEvent {
  at: string;
  status?: OrderStatus;
  message: string;
}

export interface Order {
  id: ID;
  number: string;
  customerId: ID;
  salespersonId: ID;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  total: number;
  paymentType: PaymentType;
  status: OrderStatus;
  channel: OrderChannel;
  createdAt: string;
  updatedAt: string;
  deliveryDate?: string;
  notes?: string;
  /** True when this order reserved stock on creation (demo-created orders). */
  stockReserved?: boolean;
  /** Explicit event log. Seed orders omit it and get one derived from status. */
  history?: OrderEvent[];
}

export type PaymentMethod = "cash" | "transfer" | "deposit" | "other";

export interface Payment {
  id: ID;
  customerId: ID;
  amount: number;
  method: PaymentMethod;
  date: string;
  notes?: string;
  /** Who registered the payment. */
  salespersonId?: ID;
}

/** Initial balance carried from before the system started (treated as a charge). */
export interface OpeningBalance {
  customerId: ID;
  amount: number;
  date: string;
}

export type InventoryMovementType = "in" | "out" | "adjustment" | "sale" | "return";

export interface InventoryMovement {
  id: ID;
  productId: ID;
  type: InventoryMovementType;
  /** Signed quantity applied to stock. */
  quantity: number;
  stockAfter: number;
  reason: string;
  date: string;
}

export type NotificationKind = "stock" | "order" | "debt" | "payment" | "system";

export interface AppNotification {
  id: ID;
  kind: NotificationKind;
  title: string;
  description: string;
  href: string;
  date: string;
  read: boolean;
}

/** Aggregated sales for days older than the detailed order history. */
export interface DailySummary {
  date: string;
  sales: number;
  orders: number;
  credit: number;
}

export interface Company {
  name: string;
  city: string;
  industry: string;
  phone: string;
  ownerName: string;
  ownerFullName: string;
  warehouseUser: string;
}

export interface DemoData {
  version: number;
  seededAt: string;
  company: Company;
  products: Product[];
  customers: Customer[];
  salespeople: Salesperson[];
  orders: Order[];
  payments: Payment[];
  openingBalances: OpeningBalance[];
  inventoryMovements: InventoryMovement[];
  notifications: AppNotification[];
  dailySummaries: DailySummary[];
  /** Sequence used for new order numbers (PED-xxxx). */
  nextOrderNumber: number;
}

/** A charge or credit on a customer's account, for the account statement. */
export interface AccountMovement {
  id: string;
  date: string;
  kind: "order" | "payment" | "opening";
  description: string;
  reference?: string;
  href?: string;
  charge: number;
  credit: number;
  balance: number;
}
