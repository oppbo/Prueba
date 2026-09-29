import type { Order, OrderChannel, OrderItem, OrderStatus, PaymentType } from "@/lib/types";
import { priceFor } from "@/lib/domain/pricing";
import { buildItem, orderTotals } from "@/lib/domain/orders";
import { round2 } from "@/lib/utils";
import type { CustomerSeed } from "./customers";
import { PRODUCT_SEEDS } from "./products";
import type { Random } from "./random";

const MINUTE = 60_000;
const DAY = 86_400_000;

/** Days of detailed order history (older days use daily summaries). */
export const DETAILED_DAYS = 21;
export const TODAY_ORDERS = 84;

interface DraftOrder {
  customer: CustomerSeed;
  createdAt: Date;
  items: OrderItem[];
  discountPercent: number;
  paymentType: PaymentType;
  channel: OrderChannel;
  status: OrderStatus;
  updatedAt: Date;
}

function dayStart(now: Date, daysAgo: number): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function ordersForDay(random: Random, date: Date, daysAgo: number): number {
  if (daysAgo === 0) return TODAY_ORDERS;
  const weekday = date.getDay();
  if (weekday === 0) return random.int(8, 14);
  if (weekday === 6) return random.int(52, 66);
  return random.int(66, 90);
}

function pickItems(random: Random, customer: CustomerSeed, allowOutOfStock: boolean): OrderItem[] {
  const lines = random.weighted([1, 2, 3, 4, 5, 6], (n) => [1, 3, 4, 4, 2, 1][n - 1]);
  const pool = PRODUCT_SEEDS.filter((p) => allowOutOfStock || p.stock > 0);
  const chosen = new Set<string>();
  const items: OrderItem[] = [];
  const bulk = customer.customerType === "Mayorista" || customer.customerType === "Supermercado";
  while (items.length < lines && chosen.size < pool.length) {
    const product = random.weighted(pool, (p) => (chosen.has(p.id) ? 0 : p.popularity));
    if (chosen.has(product.id)) break;
    chosen.add(product.id);
    let quantity = random.pick(product.quantities);
    if (bulk) quantity *= random.pick([2, 3, 3, 4]);
    if (customer.customerType === "Kiosco") quantity = Math.max(1, Math.round(quantity / 2));
    items.push(buildItem(product, quantity, priceFor(product, customer.priceList)));
  }
  return items;
}

/** Status for today's orders: the earliest are delivered, the latest still pending. */
function todayStatus(random: Random, position: number): OrderStatus {
  if (position < 0.42) return random.chance(0.8) ? "delivered" : "dispatched";
  if (position < 0.56) return "dispatched";
  if (position < 0.74) return "ready";
  if (position < 0.88) return "preparing";
  return random.chance(0.6) ? "confirmed" : "pending";
}

function stepsFor(status: OrderStatus): number {
  return ["pending", "confirmed", "preparing", "ready", "dispatched", "delivered"].indexOf(status);
}

export function generateOrders(random: Random, now: Date, customers: CustomerSeed[]): DraftOrder[] {
  const active = customers.filter((c) => c.status === "active" && c.weight > 0);
  const drafts: DraftOrder[] = [];

  for (let daysAgo = DETAILED_DAYS - 1; daysAgo >= 0; daysAgo--) {
    const start = dayStart(now, daysAgo);
    const count = ordersForDay(random, start, daysAgo);
    let openAt = start.getTime() + 7 * 60 * MINUTE;
    let close = start.getTime() + 19 * 60 * MINUTE;
    if (daysAgo === 0) {
      // Today's orders must never be in the future, even very early in the day.
      close = Math.max(now.getTime() - 4 * MINUTE, start.getTime() + MINUTE);
      openAt = Math.max(start.getTime(), Math.min(openAt, close - 90 * MINUTE));
    }

    const times = Array.from({ length: count }, () => openAt + random.next() * (close - openAt)).sort((a, b) => a - b);
    times.forEach((time, index) => {
      const customer = random.weighted(active, (c) => c.weight);
      const createdAt = new Date(time);
      const isToday = daysAgo === 0;
      const items = pickItems(random, customer, !isToday);
      const paymentType: PaymentType =
        customer.creditProfile !== "none" && random.chance(customer.customerType === "Mayorista" ? 0.55 : 0.36) ? "credit" : "cash";
      const channel: OrderChannel = random.weighted<OrderChannel>(["seller", "whatsapp", "phone"], (c) =>
        c === "seller" ? 6 : c === "whatsapp" ? 3 : 1,
      );
      let status: OrderStatus;
      if (isToday) status = todayStatus(random, index / count);
      else if (daysAgo === 1 && index > count - 3) status = "dispatched";
      else status = random.chance(0.025) ? "cancelled" : "delivered";

      const subtotalGuess = items.reduce((acc, i) => acc + i.subtotal, 0);
      const discountPercent = subtotalGuess > 1500 && random.chance(0.35) ? 2 : 0;

      let updatedAt: Date;
      if (status === "pending") updatedAt = createdAt;
      else if (isToday) {
        const elapsed = now.getTime() - createdAt.getTime();
        const progress = Math.min(1, (stepsFor(status) + 0.5) / 6);
        updatedAt = new Date(createdAt.getTime() + Math.max(2 * MINUTE, elapsed * progress * 0.95));
      } else if (status === "cancelled") {
        updatedAt = new Date(createdAt.getTime() + random.int(10, 120) * MINUTE);
      } else {
        updatedAt = new Date(Math.min(createdAt.getTime() + random.int(14, 26) * 60 * MINUTE, now.getTime() - 5 * MINUTE));
      }

      drafts.push({ customer, createdAt, items, discountPercent, paymentType, channel, status, updatedAt });
    });
  }
  return drafts;
}

/** Scripted history for "Tienda Don José", the customer used in the live demo. */
export function donJoseOrders(now: Date, customer: CustomerSeed): DraftOrder[] {
  const byId = new Map(PRODUCT_SEEDS.map((p) => [p.id, p]));
  const items = (lines: [string, number][]) =>
    lines.map(([id, qty]) => {
      const p = byId.get(id)!;
      return buildItem(p, qty, priceFor(p, customer.priceList));
    });
  const at = (daysAgo: number, hour: number, minute: number) => {
    const d = dayStart(now, daysAgo);
    d.setHours(hour, minute, 0, 0);
    return d;
  };
  const delivered = (created: Date) => new Date(created.getTime() + 20 * 60 * MINUTE);

  const script: { daysAgo: number; h: number; m: number; paymentType: PaymentType; lines: [string, number][] }[] = [
    { daysAgo: 42, h: 10, m: 12, paymentType: "credit", lines: [["p01", 24], ["p02", 12], ["p07", 6], ["p10", 12], ["p12", 5], ["p13", 5], ["p19", 24]] },
    { daysAgo: 34, h: 9, m: 40, paymentType: "cash", lines: [["p01", 12], ["p05", 6], ["p14", 20], ["p23", 6]] },
    { daysAgo: 25, h: 11, m: 5, paymentType: "credit", lines: [["p01", 24], ["p04", 12], ["p07", 6], ["p10", 12], ["p12", 3], ["p16", 12], ["p26", 4]] },
    { daysAgo: 17, h: 10, m: 30, paymentType: "cash", lines: [["p01", 12], ["p06", 12], ["p14", 20], ["p19", 12], ["p24", 6]] },
    { daysAgo: 8, h: 9, m: 55, paymentType: "credit", lines: [["p01", 12], ["p07", 6], ["p08", 4], ["p10", 12], ["p12", 5], ["p13", 4], ["p14", 20], ["p26", 3]] },
  ];

  return script.map((s) => {
    const createdAt = at(s.daysAgo, s.h, s.m);
    return {
      customer,
      createdAt,
      items: items(s.lines),
      discountPercent: 0,
      paymentType: s.paymentType,
      channel: "seller" as const,
      status: "delivered" as const,
      updatedAt: delivered(createdAt),
    };
  });
}

export function finalizeOrders(drafts: DraftOrder[], firstNumber: number): Order[] {
  const sorted = [...drafts].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  return sorted.map((d, i) => {
    const totals = orderTotals(d.items, d.discountPercent);
    const number = firstNumber + i;
    return {
      id: `o${number}`,
      number: `PED-${String(number).padStart(4, "0")}`,
      customerId: d.customer.id,
      salespersonId: d.customer.salespersonId,
      items: d.items,
      subtotal: totals.subtotal,
      discount: totals.discount,
      total: round2(totals.total),
      paymentType: d.paymentType,
      status: d.status,
      channel: d.channel,
      createdAt: d.createdAt.toISOString(),
      updatedAt: d.updatedAt.toISOString(),
      deliveryDate: new Date(d.createdAt.getTime() + DAY).toISOString(),
    };
  });
}
