import type { AccountMovement, Customer, CustomerAccount, DemoData, ID, Order, Payment } from "@/lib/types";
import { addDays, daysBetween, startOfDay } from "@/lib/format";
import { round2 } from "@/lib/utils";

interface Charge {
  date: string;
  dueDate: string;
  amount: number;
}

export interface AccountDetail extends CustomerAccount {
  /** Unpaid amount whose due date falls within the next 7 days. */
  dueThisWeek: number;
}

function isCreditCharge(order: Order): boolean {
  return order.paymentType === "credit" && order.status !== "cancelled";
}

/** Index orders and payments by customer once, so account math stays O(n). */
export function indexByCustomer(data: Pick<DemoData, "orders" | "payments">) {
  const orders = new Map<ID, Order[]>();
  const payments = new Map<ID, Payment[]>();
  for (const order of data.orders) {
    const list = orders.get(order.customerId);
    if (list) list.push(order);
    else orders.set(order.customerId, [order]);
  }
  for (const payment of data.payments) {
    const list = payments.get(payment.customerId);
    if (list) list.push(payment);
    else payments.set(payment.customerId, [payment]);
  }
  return { orders, payments };
}

/**
 * Account state derived from credit sales and payments, applying payments FIFO
 * to the oldest charges first. A charge is overdue once its due date has passed.
 */
export function computeAccount(
  customer: Customer,
  orders: Order[],
  payments: Payment[],
  opening: number | undefined,
  openingDate: string | undefined,
  now: Date = new Date(),
): AccountDetail {
  const charges: Charge[] = [];
  if (opening && openingDate) {
    charges.push({ date: openingDate, dueDate: openingDate, amount: opening });
  }
  let lastOrderDate: string | null = null;
  for (const order of orders) {
    if (order.status !== "cancelled" && (!lastOrderDate || order.createdAt > lastOrderDate)) lastOrderDate = order.createdAt;
    if (isCreditCharge(order)) {
      charges.push({
        date: order.createdAt,
        dueDate: addDays(order.createdAt, customer.creditDays).toISOString(),
        amount: order.total,
      });
    }
  }
  charges.sort((a, b) => a.date.localeCompare(b.date));

  let paid = 0;
  let lastPaymentDate: string | null = null;
  let lastPaymentAmount = 0;
  for (const p of payments) {
    paid += p.amount;
    if (!lastPaymentDate || p.date > lastPaymentDate) {
      lastPaymentDate = p.date;
      lastPaymentAmount = p.amount;
    }
  }

  const today = startOfDay(now);
  const weekEnd = addDays(today, 7);
  let remainingPayment = paid;
  let currentDebt = 0;
  let overdueDebt = 0;
  let dueThisWeek = 0;
  let nextDueDate: string | null = null;
  let nextDueAmount = 0;
  let oldestOverdueDays = 0;

  for (const charge of charges) {
    const applied = Math.min(charge.amount, remainingPayment);
    remainingPayment -= applied;
    const unpaid = round2(charge.amount - applied);
    if (unpaid <= 0.009) continue;
    currentDebt += unpaid;
    const due = new Date(charge.dueDate);
    if (due < today) {
      overdueDebt += unpaid;
      oldestOverdueDays = Math.max(oldestOverdueDays, daysBetween(due, today));
    } else {
      if (!nextDueDate || charge.dueDate < nextDueDate) {
        nextDueDate = charge.dueDate;
        nextDueAmount = unpaid;
      } else if (nextDueDate && daysBetween(nextDueDate, charge.dueDate) === 0) {
        nextDueAmount += unpaid;
      }
      if (due <= weekEnd) dueThisWeek += unpaid;
    }
  }

  currentDebt = round2(currentDebt);
  return {
    customerId: customer.id,
    currentDebt,
    overdueDebt: round2(overdueDebt),
    availableCredit: round2(Math.max(customer.creditLimit - currentDebt, 0)),
    nextDueDate,
    nextDueAmount: round2(nextDueAmount),
    oldestOverdueDays,
    lastOrderDate,
    lastPaymentDate,
    lastPaymentAmount,
    dueThisWeek: round2(dueThisWeek),
  };
}

export function computeAllAccounts(data: DemoData, now: Date = new Date()): Map<ID, AccountDetail> {
  const { orders, payments } = indexByCustomer(data);
  const openings = new Map(data.openingBalances.map((o) => [o.customerId, o]));
  const result = new Map<ID, AccountDetail>();
  for (const customer of data.customers) {
    const opening = openings.get(customer.id);
    result.set(
      customer.id,
      computeAccount(customer, orders.get(customer.id) ?? [], payments.get(customer.id) ?? [], opening?.amount, opening?.date, now),
    );
  }
  return result;
}

/** Chronological account statement with running balance (newest first). */
export function accountStatement(data: DemoData, customerId: ID): AccountMovement[] {
  const rows: Omit<AccountMovement, "balance">[] = [];
  const opening = data.openingBalances.find((o) => o.customerId === customerId);
  if (opening) {
    rows.push({ id: `open-${customerId}`, date: opening.date, kind: "opening", description: "Saldo inicial migrado", charge: opening.amount, credit: 0 });
  }
  for (const order of data.orders) {
    if (order.customerId !== customerId || order.paymentType !== "credit" || order.status === "cancelled") continue;
    rows.push({
      id: order.id,
      date: order.createdAt,
      kind: "order",
      description: "Venta a crédito",
      reference: order.number,
      href: `/pedidos/${order.id}`,
      charge: order.total,
      credit: 0,
    });
  }
  for (const payment of data.payments) {
    if (payment.customerId !== customerId) continue;
    rows.push({
      id: payment.id,
      date: payment.date,
      kind: "payment",
      description: payment.notes ? `Pago · ${payment.notes}` : "Pago recibido",
      reference: payment.id.toUpperCase(),
      charge: 0,
      credit: payment.amount,
    });
  }
  rows.sort((a, b) => a.date.localeCompare(b.date));
  let balance = 0;
  const withBalance = rows.map((row) => {
    balance = round2(balance + row.charge - row.credit);
    return { ...row, balance };
  });
  return withBalance.reverse();
}
