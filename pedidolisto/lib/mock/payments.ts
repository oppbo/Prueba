import type { OpeningBalance, Order, Payment, PaymentMethod } from "@/lib/types";
import { round2 } from "@/lib/utils";
import type { CustomerSeed } from "./customers";
import type { Random } from "./random";

const DAY = 86_400_000;

function paymentTime(random: Random, base: number, now: Date): Date {
  const d = new Date(base);
  d.setHours(random.int(8, 18), random.int(0, 59), 0, 0);
  if (d.getTime() > now.getTime()) {
    // Payments dated today must already have happened.
    return new Date(now.getTime() - random.int(10, 240) * 60_000);
  }
  return d;
}

/**
 * Simulate how each credit customer pays their credit sales, according to
 * their profile, so balances and overdue amounts emerge from real movements.
 */
export function generatePayments(
  random: Random,
  now: Date,
  customers: CustomerSeed[],
  orders: Order[],
): { payments: Payment[]; openingBalances: OpeningBalance[] } {
  const payments: Payment[] = [];
  const openingBalances: OpeningBalance[] = [];
  const creditOrders = new Map<string, Order[]>();
  for (const order of orders) {
    if (order.paymentType !== "credit" || order.status === "cancelled") continue;
    const list = creditOrders.get(order.customerId) ?? [];
    list.push(order);
    creditOrders.set(order.customerId, list);
  }

  let seq = 1;
  const push = (customer: CustomerSeed, amount: number, date: Date, notes?: string) => {
    const method: PaymentMethod = random.weighted<PaymentMethod>(["cash", "transfer", "deposit", "other"], (m) =>
      m === "cash" ? 5 : m === "transfer" ? 4 : m === "deposit" ? 1.5 : 0.3,
    );
    payments.push({
      id: `pg${String(seq++).padStart(4, "0")}`,
      customerId: customer.id,
      amount: round2(amount),
      method,
      date: date.toISOString(),
      notes,
      salespersonId: customer.salespersonId,
    });
  };

  for (const customer of customers) {
    if (customer.creditProfile === "none") continue;

    const charges: { date: number; amount: number }[] = [];
    if (customer.opening) {
      const date = new Date(now.getTime() - customer.opening.daysAgo * DAY);
      openingBalances.push({ customerId: customer.id, amount: customer.opening.amount, date: date.toISOString() });
      charges.push({ date: date.getTime(), amount: customer.opening.amount });
    }
    for (const order of creditOrders.get(customer.id) ?? []) {
      charges.push({ date: new Date(order.createdAt).getTime(), amount: order.total });
    }
    charges.sort((a, b) => a.date - b.date);

    // Scripted customer for the live demo: one payment that settled the oldest sale.
    if (customer.id === "c001") {
      if (charges[0]) push(customer, charges[0].amount, paymentTime(random, now.getTime() - 11 * DAY, now), "Pago en efectivo al vendedor");
      continue;
    }

    for (const charge of charges) {
      let delayDays: number;
      let fraction = 1;
      if (customer.creditProfile === "prompt") delayDays = random.int(0, 4);
      else if (customer.creditProfile === "regular") delayDays = random.int(5, customer.creditDays - 1);
      else {
        delayDays = customer.creditDays + random.int(10, 30);
        if (random.chance(0.45)) fraction = random.pick([0.3, 0.5, 0.6]);
      }
      const payAt = charge.date + delayDays * DAY;
      if (payAt > now.getTime()) continue;
      const amount = Math.round(charge.amount * fraction);
      if (amount <= 0) continue;
      push(customer, amount, paymentTime(random, payAt, now), fraction < 1 ? "Pago parcial" : undefined);
    }
  }

  payments.sort((a, b) => a.date.localeCompare(b.date));
  return { payments, openingBalances };
}
