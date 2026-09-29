import { createSeedData } from "@/lib/mock/seed";
import { computeAllAccounts } from "@/lib/domain/accounts";
import { isToday } from "@/lib/format";

const data = createSeedData(new Date());
const accounts = [...computeAllAccounts(data).values()];
const today = data.orders.filter((o) => isToday(o.createdAt) && o.status !== "cancelled");
const sales = today.reduce((a, o) => a + o.total, 0);
const credit = today.filter((o) => o.paymentType === "credit").reduce((a, o) => a + o.total, 0);
const payToday = data.payments.filter((p) => isToday(p.date)).reduce((a, p) => a + p.amount, 0);
console.log({
  customers: data.customers.length,
  orders: data.orders.length,
  todayOrders: today.length,
  sales: Math.round(sales),
  credit: Math.round(credit),
  avg: Math.round(sales / today.length),
  paymentsToday: Math.round(payToday),
  withDebt: accounts.filter((a) => a.currentDebt > 0).length,
  overdue: accounts.filter((a) => a.overdueDebt > 0).length,
  receivable: Math.round(accounts.reduce((a, x) => a + x.currentDebt, 0)),
  overdueAmount: Math.round(accounts.reduce((a, x) => a + x.overdueDebt, 0)),
  dueWeek: Math.round(accounts.reduce((a, x) => a + x.dueThisWeek, 0)),
  size: JSON.stringify(data).length,
  statuses: today.reduce((m, o) => ((m[o.status] = (m[o.status] ?? 0) + 1), m), {} as Record<string, number>),
});
console.log(accounts.find((a) => a.customerId === "c001"));
