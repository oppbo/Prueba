"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, CalendarDays, ChevronDown, ClipboardList, MessageCircle, Phone, Truck, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { EmptyState } from "@/components/shared/empty-state";
import { OrderStatusBadge, PaymentTypeBadge } from "@/components/shared/status-badges";
import { ProductThumb } from "@/components/shared/product-thumb";
import { StatusTimeline } from "@/components/order-detail/status-timeline";
import { ORDER_CHANNEL, ORDER_STATUS } from "@/lib/labels";
import { nextStatuses, orderHistory, orderUnits } from "@/lib/domain/orders";
import { addDays, formatDate, formatDateTime, formatMoney, formatTime, isToday } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useData, useLookups } from "@/lib/store/hooks";
import type { OrderStatus } from "@/lib/types";

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const lookups = useLookups();
  const updateStatus = useDemoStore((s) => s.updateOrderStatus);
  const order = data.orders.find((o) => o.id === id);

  if (!order) {
    return (
      <EmptyState
        icon={ClipboardList}
        title="Pedido no encontrado"
        action={
          <Button asChild variant="secondary">
            <Link href="/pedidos">Volver a pedidos</Link>
          </Button>
        }
      />
    );
  }

  const customer = lookups.customer.get(order.customerId);
  const seller = lookups.salesperson.get(order.salespersonId);
  const events = orderHistory(order, seller?.name ?? "Vendedor");
  const options = nextStatuses(order.status);

  const change = (status: OrderStatus) => {
    updateStatus(order.id, status);
    toast.success(`${order.number} · ${ORDER_STATUS[status].label}`, {
      description: status === "cancelled" ? "El stock reservado fue liberado." : "El cambio ya es visible para almacén y vendedores.",
    });
  };

  return (
    <div className="space-y-6">
      <Link href="/pedidos" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Pedidos
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-semibold tracking-tight tabular">{order.number}</h1>
            <OrderStatusBadge status={order.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {formatDateTime(order.createdAt)} · vía {ORDER_CHANNEL[order.channel]}
          </p>
        </div>
        <div className="flex gap-2">
          {customer && (
            <Button asChild variant="secondary" className="flex-1 sm:flex-none">
              <Link href={`/clientes/${customer.id}`}>
                <UserRound /> Ver cliente
              </Link>
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button className="flex-1 sm:flex-none" disabled={!options.length}>
                Cambiar estado <ChevronDown />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              <DropdownMenuLabel>Mover a</DropdownMenuLabel>
              {options
                .filter((s) => s !== "cancelled")
                .map((s) => (
                  <DropdownMenuItem key={s} onSelect={() => change(s)}>
                    <span className="size-2 rounded-full bg-current opacity-60" />
                    {ORDER_STATUS[s].label}
                  </DropdownMenuItem>
                ))}
              {options.includes("cancelled") && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => change("cancelled")}>
                    Cancelar pedido
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card>
        <CardContent className="pt-5">
          <StatusTimeline status={order.status} events={events} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Productos</CardTitle>
              <span className="text-sm text-muted-foreground tabular">
                {order.items.length} productos · {orderUnits(order)} unidades
              </span>
            </CardHeader>
            <Table>
              <THead>
                <tr>
                  <TH>Producto</TH>
                  <TH className="text-right">Cant.</TH>
                  <TH className="hidden text-right sm:table-cell">Precio</TH>
                  <TH className="text-right">Subtotal</TH>
                </tr>
              </THead>
              <TBody>
                {order.items.map((item) => {
                  const product = lookups.product.get(item.productId);
                  return (
                    <TR key={item.productId}>
                      <TD>
                        <div className="flex items-center gap-3">
                          {product && <ProductThumb product={product} className="hidden sm:grid" />}
                          <div className="min-w-0">
                            <p className="font-medium">{product?.name ?? "Producto"}</p>
                            <p className="text-xs text-muted-foreground">
                              {product?.unit}
                              <span className="sm:hidden tabular"> · {formatMoney(item.unitPrice)}</span>
                            </p>
                          </div>
                        </div>
                      </TD>
                      <TD className="text-right text-base font-semibold tabular">{item.quantity}</TD>
                      <TD className="hidden text-right text-muted-foreground tabular sm:table-cell">{formatMoney(item.unitPrice)}</TD>
                      <TD className="text-right font-medium whitespace-nowrap tabular">{formatMoney(item.subtotal)}</TD>
                    </TR>
                  );
                })}
              </TBody>
            </Table>
            <dl className="space-y-2 border-t border-border px-5 py-4 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subtotal</dt>
                <dd className="tabular">{formatMoney(order.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Descuento</dt>
                <dd className="tabular">{order.discount ? `−${formatMoney(order.discount)}` : formatMoney(0)}</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-border pt-3">
                <dt className="font-medium">Total</dt>
                <dd className="text-xl font-semibold tabular">{formatMoney(order.total)}</dd>
              </div>
            </dl>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="space-y-3">
                {[...events].reverse().map((e, i) => (
                  <li key={`${e.at}-${i}`} className="flex gap-3 text-sm">
                    <span className="w-12 shrink-0 text-muted-foreground tabular">{formatTime(e.at)}</span>
                    <span className="relative mt-1.5 size-2 shrink-0 rounded-full bg-primary/70" />
                    <span className="min-w-0">
                      {e.message}
                      {!isToday(e.at) && (
                        <span className="ml-1.5 text-xs text-muted-foreground">{formatDate(e.at)}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="space-y-4 pt-5 text-sm">
              <div>
                <p className="text-xs text-muted-foreground">Cliente</p>
                {customer ? (
                  <Link href={`/clientes/${customer.id}`} className="mt-0.5 block font-semibold hover:text-primary">
                    {customer.businessName}
                  </Link>
                ) : (
                  <p className="mt-0.5 font-semibold">—</p>
                )}
                <p className="text-muted-foreground">{customer ? `${customer.zone} · ${customer.address}` : ""}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vendedor</p>
                  <p className="mt-0.5 font-medium">{seller?.name}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Fecha</p>
                  <p className="mt-0.5 font-medium">{formatDateTime(order.createdAt)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Condición</p>
                  <div className="mt-1">
                    <PaymentTypeBadge type={order.paymentType} />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Estado</p>
                  <div className="mt-1">
                    <OrderStatusBadge status={order.status} />
                  </div>
                </div>
              </div>
              {order.deliveryDate && (
                <p className="flex items-center gap-2 rounded-lg bg-muted/60 px-3 py-2">
                  <Truck className="size-4 text-muted-foreground" /> Entrega programada: {formatDate(order.deliveryDate)}
                </p>
              )}
              {order.paymentType === "credit" && customer && (
                <p className="flex items-center gap-2 rounded-lg bg-info-soft px-3 py-2 text-info-soft-foreground">
                  <CalendarDays className="size-4" /> Vence el {formatDate(addDays(order.createdAt, customer.creditDays))}
                </p>
              )}
              {order.notes && (
                <div>
                  <p className="text-xs text-muted-foreground">Nota</p>
                  <p className="mt-0.5">{order.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
          {customer && (
            <div className="grid grid-cols-2 gap-2">
              <Button asChild variant="secondary">
                <a href={`tel:+591${customer.phone}`}>
                  <Phone /> Llamar
                </a>
              </Button>
              <Button asChild variant="secondary">
                <a
                  href={`https://wa.me/591${customer.phone}?text=${encodeURIComponent(`Hola ${customer.ownerName.split(" ")[0]}, su pedido ${order.number} por ${formatMoney(order.total)} está ${ORDER_STATUS[order.status].label.toLowerCase()}. ¡Gracias por su compra!`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="text-[#128c4a]" /> WhatsApp
                </a>
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
