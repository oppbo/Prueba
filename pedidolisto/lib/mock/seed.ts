import type { AppNotification, DailySummary, DemoData, InventoryMovement, Order } from "@/lib/types";
import { computeAllAccounts } from "@/lib/domain/accounts";
import { stockStatus } from "@/lib/domain/inventory";
import { formatMoney, isSameDay } from "@/lib/format";
import { firstName } from "@/lib/utils";
import { seedCustomers, stripCustomerSeed, type CustomerSeed } from "./customers";
import { DETAILED_DAYS, donJoseOrders, finalizeOrders, generateOrders } from "./orders";
import { generatePayments } from "./payments";
import { seedProducts } from "./products";
import { createRandom, type Random } from "./random";
import { SALESPEOPLE } from "./salespeople";

export const DEMO_VERSION = 3;
const SEED = 20260929;
const DAY = 86_400_000;
const FIRST_ORDER_NUMBER = 1101;

export const COMPANY = {
  name: "Distribuidora Illimani",
  city: "La Paz, Bolivia",
  industry: "Productos de consumo masivo",
  phone: "22145870",
  ownerName: "Marcelo",
  ownerFullName: "Marcelo Rojas",
  warehouseUser: "Luis Choque",
};

/** Keep today's credit share realistic (~19% of sales) regardless of random draws. */
function rebalanceTodayCredit(orders: Order[], customers: CustomerSeed[], now: Date) {
  const profiles = new Map(customers.map((c) => [c.id, c.creditProfile]));
  const today = orders.filter((o) => isSameDay(o.createdAt, now) && o.status !== "cancelled");
  const sales = today.reduce((acc, o) => acc + o.total, 0);
  let credit = today.filter((o) => o.paymentType === "credit").reduce((acc, o) => acc + o.total, 0);
  const target = sales * 0.19;
  // Spread credit sales through the day instead of front-loading them.
  const spread = today.map((o, i) => ({ o, k: (i * 37) % today.length })).sort((a, b) => a.k - b.k).map((x) => x.o);
  for (const order of spread) {
    if (credit >= target) break;
    if (order.paymentType === "credit" || profiles.get(order.customerId) === "none") continue;
    order.paymentType = "credit";
    credit += order.total;
  }
}

/** A few collections registered earlier today by the sales team. */
function addTodayCollections(random: Random, data: DemoData, customers: CustomerSeed[], now: Date) {
  const accounts = computeAllAccounts(data, now);
  const candidates = customers.filter((c) => c.id !== "c001" && c.id !== "c004" && (accounts.get(c.id)?.currentDebt ?? 0) > 400);
  const chosen = random.shuffle(candidates).slice(0, 5);
  const start = new Date(now);
  start.setHours(8, 0, 0, 0);
  chosen.forEach((customer, i) => {
    const debt = accounts.get(customer.id)!.currentDebt;
    const amount = Math.max(100, Math.round((debt * random.pick([0.2, 0.3, 0.5])) / 50) * 50);
    const span = Math.max(now.getTime() - start.getTime(), 60 * 60_000);
    const date = new Date(Math.min(start.getTime() + (span * (i + 1)) / (chosen.length + 1), now.getTime() - 5 * 60_000));
    data.payments.push({
      id: `pg9${String(i + 1).padStart(3, "0")}`,
      customerId: customer.id,
      amount: Math.min(amount, debt),
      method: random.pick(["cash", "transfer", "cash"] as const),
      date: date.toISOString(),
      notes: amount >= debt ? "Cancela saldo" : "Pago a cuenta",
      salespersonId: customer.salespersonId,
    });
  });
  data.payments.sort((a, b) => a.date.localeCompare(b.date));
}

function dailySummaries(random: Random, now: Date): DailySummary[] {
  const result: DailySummary[] = [];
  for (let daysAgo = 45; daysAgo >= DETAILED_DAYS; daysAgo--) {
    const d = new Date(now);
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() - daysAgo);
    const sunday = d.getDay() === 0;
    const orders = sunday ? random.int(8, 14) : random.int(60, 88);
    const sales = Math.round(orders * random.int(410, 470));
    result.push({ date: d.toISOString(), orders, sales, credit: Math.round(sales * random.int(15, 22) / 100) });
  }
  return result;
}

function inventoryMovements(random: Random, now: Date, data: Pick<DemoData, "products">): InventoryMovement[] {
  const moves: InventoryMovement[] = [];
  const reasons = [
    "Ingreso de proveedor · Embotelladoras Bolivianas",
    "Ingreso de proveedor · PIL Andina",
    "Ingreso de proveedor · Industrias Venado",
    "Devolución de cliente",
    "Ajuste por conteo físico",
    "Merma por producto dañado",
  ];
  for (let i = 0; i < 14; i++) {
    const product = random.pick(data.products);
    const type = random.weighted(["in", "adjustment", "out"] as const, (t) => (t === "in" ? 6 : t === "adjustment" ? 2 : 1));
    const quantity = type === "in" ? random.int(4, 20) * 12 : type === "out" ? -random.int(1, 6) : random.pick([-3, -2, 2, 4]);
    const date = new Date(now.getTime() - random.int(1, 14) * DAY - random.int(0, 8) * 3_600_000);
    moves.push({
      id: `mv${String(i + 1).padStart(3, "0")}`,
      productId: product.id,
      type,
      quantity,
      stockAfter: product.stock,
      reason: type === "in" ? random.pick(reasons.slice(0, 3)) : type === "out" ? reasons[5] : reasons[4],
      date: date.toISOString(),
    });
  }
  return moves.sort((a, b) => b.date.localeCompare(a.date));
}

function seedNotifications(data: DemoData, now: Date): AppNotification[] {
  const notes: AppNotification[] = [];
  const minutesAgo = (m: number) => new Date(now.getTime() - m * 60_000).toISOString();
  const lowStock = data.products.filter((p) => stockStatus(p) !== "normal");
  const coca = data.products.find((p) => p.id === "p04") ?? lowStock[0];
  if (coca) {
    notes.push({ id: "n1", kind: "stock", title: `Stock bajo: ${coca.shortName}`, description: `Quedan ${coca.stock} unidades (mínimo ${coca.minimumStock}).`, href: "/inventario?filtro=bajo", date: minutesAgo(12), read: false });
  }
  const pending = data.orders.filter((o) => o.status === "pending").sort((a, b) => a.createdAt.localeCompare(b.createdAt))[0];
  if (pending) {
    const hours = Math.max(1, Math.round((now.getTime() - new Date(pending.createdAt).getTime()) / 3_600_000));
    notes.push({ id: "n2", kind: "order", title: `Pedido ${pending.number} lleva ${hours} ${hours === 1 ? "hora" : "horas"} pendiente`, description: "Todavía no fue confirmado ni enviado a almacén.", href: `/pedidos/${pending.id}`, date: minutesAgo(25), read: false });
  }
  const accounts = computeAllAccounts(data, now);
  const carmen = data.customers.find((c) => c.id === "c004");
  const carmenAccount = carmen ? accounts.get(carmen.id) : undefined;
  if (carmen && carmenAccount && carmenAccount.overdueDebt > 0) {
    notes.push({ id: "n3", kind: "debt", title: `${carmen.businessName} tiene ${formatMoney(carmenAccount.overdueDebt)} vencidos`, description: `Deuda vencida hace ${carmenAccount.oldestOverdueDays} días.`, href: `/clientes/${carmen.id}`, date: minutesAgo(70), read: false });
  }
  const andreaPayment = [...data.payments].reverse().find((p) => p.salespersonId === "s2");
  if (andreaPayment) {
    const customer = data.customers.find((c) => c.id === andreaPayment.customerId);
    notes.push({ id: "n4", kind: "payment", title: `Andrea registró un pago de ${formatMoney(andreaPayment.amount)}`, description: customer ? `Cliente: ${customer.businessName}` : "Pago registrado", href: "/cobranzas", date: andreaPayment.date, read: false });
  }
  const outOfStock = data.products.find((p) => p.stock <= 0);
  if (outOfStock) {
    notes.push({ id: "n5", kind: "stock", title: `Sin stock: ${outOfStock.shortName}`, description: "Los vendedores no podrán ofrecer este producto.", href: "/inventario?filtro=sin-stock", date: minutesAgo(180), read: true });
  }
  notes.push({ id: "n6", kind: "system", title: "Resumen de ayer disponible", description: `${firstName(COMPANY.ownerFullName)}, revisa las ventas y cobranzas de ayer.`, href: "/reportes", date: minutesAgo(9 * 60), read: true });
  return notes.sort((a, b) => b.date.localeCompare(a.date));
}

/** Build a fresh, internally consistent demo dataset anchored on `now`. */
export function createSeedData(now: Date = new Date()): DemoData {
  const random = createRandom(SEED);
  const customerSeeds = seedCustomers(random, now);
  const donJose = customerSeeds.find((c) => c.id === "c001")!;
  const drafts = [...generateOrders(random, now, customerSeeds), ...donJoseOrders(now, donJose)];
  const orders = finalizeOrders(drafts, FIRST_ORDER_NUMBER);
  rebalanceTodayCredit(orders, customerSeeds, now);
  const { payments, openingBalances } = generatePayments(random, now, customerSeeds, orders);
  const products = seedProducts();

  const data: DemoData = {
    version: DEMO_VERSION,
    seededAt: now.toISOString(),
    company: COMPANY,
    products,
    customers: customerSeeds.map(stripCustomerSeed),
    salespeople: SALESPEOPLE,
    orders,
    payments,
    openingBalances,
    inventoryMovements: [],
    notifications: [],
    dailySummaries: dailySummaries(random, now),
    nextOrderNumber: FIRST_ORDER_NUMBER + orders.length,
  };
  addTodayCollections(random, data, customerSeeds, now);
  data.inventoryMovements = inventoryMovements(random, now, data);
  data.notifications = seedNotifications(data, now);
  return data;
}
