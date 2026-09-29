"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { OrderStatusBadge, PaymentTypeBadge } from "@/components/shared/status-badges";
import { formatDateTime, formatMoney, formatTime, isToday } from "@/lib/format";
import { orderUnits } from "@/lib/domain/orders";
import { useLookups } from "@/lib/store/hooks";
import type { Order } from "@/lib/types";
import { cn } from "@/lib/utils";

export interface OrdersTableProps {
  orders: Order[];
  showCustomer?: boolean;
  showSeller?: boolean;
  showItems?: boolean;
  /** Show only the time for today's orders (dashboard). */
  compactTime?: boolean;
  className?: string;
}

function when(order: Order, compactTime: boolean) {
  return compactTime && isToday(order.createdAt) ? formatTime(order.createdAt) : formatDateTime(order.createdAt);
}

export function OrdersTable({ orders, showCustomer = true, showSeller = true, showItems = false, compactTime = false, className }: OrdersTableProps) {
  const lookups = useLookups();
  const router = useRouter();

  return (
    <div className={className}>
      {/* Desktop / tablet */}
      <div className="hidden md:block">
        <Table>
          <THead>
            <tr>
              <TH>Pedido</TH>
              {showCustomer && <TH>Cliente</TH>}
              {showSeller && <TH className="hidden lg:table-cell">Vendedor</TH>}
              {showItems && <TH className="hidden xl:table-cell">Productos</TH>}
              <TH className="text-right">Total</TH>
              <TH>Pago</TH>
              <TH>Estado</TH>
              <TH className="text-right">{compactTime ? "Hora" : "Fecha"}</TH>
            </tr>
          </THead>
          <TBody>
            {orders.map((o) => {
              const customer = lookups.customer.get(o.customerId);
              const seller = lookups.salesperson.get(o.salespersonId);
              return (
                <TR key={o.id} className="cursor-pointer" onClick={() => router.push(`/pedidos/${o.id}`)}>
                  <TD className="font-medium whitespace-nowrap tabular">
                    <Link href={`/pedidos/${o.id}`} className="hover:text-primary" onClick={(e) => e.stopPropagation()}>
                      {o.number}
                    </Link>
                  </TD>
                  {showCustomer && (
                    <TD className="max-w-56">
                      <p className="truncate font-medium">{customer?.businessName}</p>
                      <p className="truncate text-xs text-muted-foreground">{customer?.zone}</p>
                    </TD>
                  )}
                  {showSeller && <TD className="hidden whitespace-nowrap text-muted-foreground lg:table-cell">{seller?.name}</TD>}
                  {showItems && (
                    <TD className="hidden whitespace-nowrap text-muted-foreground xl:table-cell">
                      {o.items.length} {o.items.length === 1 ? "producto" : "productos"} · {orderUnits(o)} u.
                    </TD>
                  )}
                  <TD className="text-right font-medium whitespace-nowrap tabular">{formatMoney(o.total)}</TD>
                  <TD>
                    <PaymentTypeBadge type={o.paymentType} />
                  </TD>
                  <TD>
                    <OrderStatusBadge status={o.status} />
                  </TD>
                  <TD className="text-right whitespace-nowrap text-muted-foreground tabular">{when(o, compactTime)}</TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>

      {/* Mobile: cards */}
      <ul className="divide-y divide-border md:hidden">
        {orders.map((o) => {
          const customer = lookups.customer.get(o.customerId);
          const seller = lookups.salesperson.get(o.salespersonId);
          return (
            <li key={o.id}>
              <Link href={`/pedidos/${o.id}`} className="flex items-center gap-3 px-4 py-3 active:bg-muted/60">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <p className={cn("truncate text-sm font-medium", !showCustomer && "tabular")}>{showCustomer ? customer?.businessName : o.number}</p>
                    <p className="shrink-0 text-sm font-semibold tabular">{formatMoney(o.total)}</p>
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {showCustomer && <span className="tabular">{o.number} · </span>}
                    {when(o, compactTime)}
                    {showSeller && seller ? ` · ${seller.name.split(" ")[0]}` : ""}
                  </p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <OrderStatusBadge status={o.status} />
                    <PaymentTypeBadge type={o.paymentType} />
                  </div>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
