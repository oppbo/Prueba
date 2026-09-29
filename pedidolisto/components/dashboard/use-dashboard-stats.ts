"use client";

import { useMemo } from "react";
import { change, dayStats, salesSeries, topProducts, sellerStats, ordersOnDay } from "@/lib/domain/analytics";
import { stockStatus } from "@/lib/domain/inventory";
import { addDays, daysBetween } from "@/lib/format";
import { useAccounts, useData } from "@/lib/store/hooks";
import type { DemoData, ID } from "@/lib/types";

/** Restrict data to one salesperson (seller view). */
function scope(data: DemoData, salespersonId?: ID): Pick<DemoData, "orders" | "payments" | "dailySummaries"> {
  if (!salespersonId) return data;
  return {
    orders: data.orders.filter((o) => o.salespersonId === salespersonId),
    payments: data.payments.filter((p) => p.salespersonId === salespersonId),
    dailySummaries: [],
  };
}

/** Today's figures and comparisons vs yesterday for the dashboards. */
export function useDashboardStats(salespersonId?: ID) {
  const data = useData();
  const accounts = useAccounts();
  return useMemo(() => {
    const now = new Date();
    const scoped = scope(data, salespersonId);
    const today = dayStats(scoped, now);
    // Sundays are a short day for distributors: compare against the last working day.
    let previousDay = addDays(now, -1);
    if (previousDay.getDay() === 0 && now.getDay() !== 0) previousDay = addDays(now, -2);
    const comparisonLabel = daysBetween(previousDay, now) === 1 ? "vs ayer" : "vs sábado";
    const yesterdaySoFar = dayStats(scoped, previousDay);
    const todayOrders = ordersOnDay(scoped.orders, now);

    const customerIds = salespersonId ? new Set(data.customers.filter((c) => c.salespersonId === salespersonId).map((c) => c.id)) : null;
    const accountList = [...accounts.values()].filter((a) => !customerIds || customerIds.has(a.customerId));
    const overdueCustomers = accountList.filter((a) => a.overdueDebt > 0);

    return {
      comparisonLabel,
      today,
      changes: {
        sales: change(today.sales, yesterdaySoFar.sales),
        collected: change(today.collected, yesterdaySoFar.collected),
        credit: change(today.credit, yesterdaySoFar.credit),
        orders: change(today.orders, yesterdaySoFar.orders),
        avgTicket: change(today.avgTicket, yesterdaySoFar.avgTicket),
      },
      series: salesSeries(scoped, 7, now),
      todayOrders,
      recentOrders: [...scoped.orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8),
      topProducts: topProducts(todayOrders, 5),
      sellers: sellerStats(
        todayOrders,
        scoped.payments.filter((p) => new Date(p.date).toDateString() === now.toDateString()),
        data.salespeople.map((s) => s.id),
      ),
      overdueCustomers: overdueCustomers.length,
      overdueAmount: overdueCustomers.reduce((a, x) => a + x.overdueDebt, 0),
      dueThisWeek: accountList.reduce((a, x) => a + x.dueThisWeek, 0),
      lowStock: data.products.filter((p) => stockStatus(p) === "low").length,
      outOfStock: data.products.filter((p) => stockStatus(p) === "out").length,
      notPrepared: todayOrders.filter((o) => o.status === "pending" || o.status === "confirmed").length,
      pendingOrders: todayOrders.filter((o) => o.status === "pending").length,
    };
  }, [data, accounts, salespersonId]);
}
