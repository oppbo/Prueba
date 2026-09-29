import type { DailySummary, DemoData, ID, Order, Payment, ProductCategory } from "@/lib/types";
import { addDays, formatShortDate, formatWeekday, isSameDay, startOfDay } from "@/lib/format";
import { round2 } from "@/lib/utils";

export type RangeKey = "today" | "7d" | "30d";

export const RANGE_LABEL: Record<RangeKey, string> = { today: "Hoy", "7d": "7 días", "30d": "30 días" };

const valid = (o: Order) => o.status !== "cancelled";

export function ordersOnDay(orders: Order[], day: Date): Order[] {
  return orders.filter((o) => valid(o) && isSameDay(o.createdAt, day));
}

export function ordersInRange(orders: Order[], range: RangeKey, now = new Date()): Order[] {
  const from = rangeStart(range, now);
  return orders.filter((o) => valid(o) && new Date(o.createdAt) >= from);
}

export function rangeStart(range: RangeKey, now = new Date()): Date {
  const days = range === "today" ? 0 : range === "7d" ? 6 : 29;
  return startOfDay(addDays(now, -days));
}

export interface DayStats {
  sales: number;
  orders: number;
  credit: number;
  cash: number;
  collected: number;
  payments: number;
  avgTicket: number;
}

export function dayStats(data: Pick<DemoData, "orders" | "payments">, day: Date): DayStats {
  const orders = ordersOnDay(data.orders, day);
  const sales = orders.reduce((a, o) => a + o.total, 0);
  const credit = orders.filter((o) => o.paymentType === "credit").reduce((a, o) => a + o.total, 0);
  const payments = data.payments.filter((p) => isSameDay(p.date, day)).reduce((a, p) => a + p.amount, 0);
  const cash = sales - credit;
  return {
    sales: round2(sales),
    orders: orders.length,
    credit: round2(credit),
    cash: round2(cash),
    payments: round2(payments),
    collected: round2(cash + payments),
    avgTicket: orders.length ? round2(sales / orders.length) : 0,
  };
}

/** Percent change vs a previous value; null when there is no baseline. */
export function change(current: number, previous: number): number | null {
  if (!previous) return null;
  return ((current - previous) / previous) * 100;
}

export interface SeriesPoint {
  date: string;
  label: string;
  sales: number;
  orders: number;
  credit: number;
  cash: number;
}

/** Daily sales series; days before the detailed history come from summaries. */
export function salesSeries(data: Pick<DemoData, "orders" | "dailySummaries">, days: number, now = new Date()): SeriesPoint[] {
  const byDay = new Map<string, SeriesPoint>();
  const points: SeriesPoint[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = startOfDay(addDays(now, -i));
    const point: SeriesPoint = {
      date: d.toISOString(),
      label: days <= 7 ? (i === 0 ? "Hoy" : formatWeekday(d)) : formatShortDate(d),
      sales: 0,
      orders: 0,
      credit: 0,
      cash: 0,
    };
    byDay.set(d.toDateString(), point);
    points.push(point);
  }
  const detailedDays = new Set<string>();
  for (const o of data.orders) {
    if (!valid(o)) continue;
    const key = new Date(o.createdAt).toDateString();
    const point = byDay.get(key);
    if (!point) continue;
    detailedDays.add(key);
    point.sales += o.total;
    point.orders += 1;
    if (o.paymentType === "credit") point.credit += o.total;
    else point.cash += o.total;
  }
  for (const s of data.dailySummaries as DailySummary[]) {
    const key = new Date(s.date).toDateString();
    const point = byDay.get(key);
    if (!point || detailedDays.has(key)) continue;
    point.sales = s.sales;
    point.orders = s.orders;
    point.credit = s.credit;
    point.cash = s.sales - s.credit;
  }
  return points.map((p) => ({ ...p, sales: round2(p.sales), credit: round2(p.credit), cash: round2(p.cash) }));
}

export interface ProductSales {
  productId: ID;
  units: number;
  revenue: number;
}

export function topProducts(orders: Order[], limit = 5): ProductSales[] {
  const map = new Map<ID, ProductSales>();
  for (const o of orders) {
    for (const item of o.items) {
      const row = map.get(item.productId) ?? { productId: item.productId, units: 0, revenue: 0 };
      row.units += item.quantity;
      row.revenue += item.subtotal;
      map.set(item.productId, row);
    }
  }
  return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, limit);
}

export function salesByCategory(orders: Order[], categoryOf: (productId: ID) => ProductCategory | undefined) {
  const map = new Map<ProductCategory, number>();
  for (const o of orders) {
    const factor = o.subtotal ? o.total / o.subtotal : 1;
    for (const item of o.items) {
      const category = categoryOf(item.productId);
      if (!category) continue;
      map.set(category, (map.get(category) ?? 0) + item.subtotal * factor);
    }
  }
  return [...map.entries()].map(([category, sales]) => ({ category, sales: round2(sales) })).sort((a, b) => b.sales - a.sales);
}

export interface SellerStats {
  salespersonId: ID;
  sales: number;
  orders: number;
  credit: number;
  cash: number;
  collected: number;
  customers: number;
}

export function sellerStats(orders: Order[], payments: Payment[], salespersonIds: ID[]): SellerStats[] {
  return salespersonIds.map((id) => {
    const own = orders.filter((o) => o.salespersonId === id);
    const sales = own.reduce((a, o) => a + o.total, 0);
    const credit = own.filter((o) => o.paymentType === "credit").reduce((a, o) => a + o.total, 0);
    const collectedPayments = payments.filter((p) => p.salespersonId === id).reduce((a, p) => a + p.amount, 0);
    return {
      salespersonId: id,
      sales: round2(sales),
      orders: own.length,
      credit: round2(credit),
      cash: round2(sales - credit),
      collected: round2(sales - credit + collectedPayments),
      customers: new Set(own.map((o) => o.customerId)).size,
    };
  });
}

/**
 * Days older than the detailed order history only exist as daily summaries.
 * Breakdowns (by product, category, seller) for long ranges are scaled by this
 * factor so they add up to the same total as the sales series.
 */
export function coverageFactor(data: Pick<DemoData, "orders" | "dailySummaries">, range: RangeKey, now = new Date()): number {
  if (range !== "30d") return 1;
  const seriesTotal = salesSeries(data, 30, now).reduce((a, p) => a + p.sales, 0);
  const detailed = ordersInRange(data.orders, range, now).reduce((a, o) => a + o.total, 0);
  return detailed > 0 ? seriesTotal / detailed : 1;
}

export interface HourPoint {
  label: string;
  sales: number;
  orders: number;
}

export function salesByHour(orders: Order[]): HourPoint[] {
  const points: HourPoint[] = [];
  for (let h = 7; h <= 19; h++) points.push({ label: `${String(h).padStart(2, "0")}:00`, sales: 0, orders: 0 });
  for (const o of orders) {
    const h = new Date(o.createdAt).getHours();
    const p = points[Math.min(Math.max(h - 7, 0), points.length - 1)];
    p.sales += o.total;
    p.orders += 1;
  }
  return points.map((p) => ({ ...p, sales: round2(p.sales) }));
}
