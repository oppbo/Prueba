"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BellRing, ClipboardList, HandCoins, MapPin, Pencil, Phone, Plus, UserRound, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/shared/avatar";
import { EmptyState } from "@/components/shared/empty-state";
import { KpiCard } from "@/components/shared/kpi-card";
import { CustomerStatusBadge } from "@/components/shared/status-badges";
import { Badge } from "@/components/ui/badge";
import { OrdersTable } from "@/components/orders/orders-table";
import { CustomerFormDialog } from "@/components/customers/customer-form-dialog";
import { AccountStatement } from "@/components/customers/account-statement";
import { CustomerSummary } from "@/components/customers/customer-summary";
import { formatLongDate, formatMoney, formatPhone } from "@/lib/format";
import { isOpenOrder } from "@/lib/domain/orders";
import { useAccounts, useData, useLookups, useRole } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { cn } from "@/lib/utils";

export default function CustomerProfilePage() {
  const { id } = useParams<{ id: string }>();
  const data = useData();
  const accounts = useAccounts();
  const lookups = useLookups();
  const role = useRole();
  const openPayment = useUiStore((s) => s.openPayment);
  const openReminder = useUiStore((s) => s.openReminder);
  const [editing, setEditing] = useState(false);

  const customer = lookups.customer.get(id);
  const account = accounts.get(id);
  const orders = useMemo(
    () => data.orders.filter((o) => o.customerId === id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [data.orders, id],
  );

  if (!customer || !account) {
    return (
      <EmptyState
        icon={UserRound}
        title="Cliente no encontrado"
        description="Puede que haya sido eliminado o que el enlace sea incorrecto."
        action={
          <Button asChild variant="secondary">
            <Link href="/clientes">Volver a clientes</Link>
          </Button>
        }
      />
    );
  }

  const pending = orders.filter(isOpenOrder);
  const seller = lookups.salesperson.get(customer.salespersonId);
  const usage = customer.creditLimit > 0 ? Math.min(100, (account.currentDebt / customer.creditLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      <Link href="/clientes" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Clientes
      </Link>

      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex items-start gap-4">
          <Avatar name={customer.businessName} className="size-14 text-base" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{customer.businessName}</h1>
              <CustomerStatusBadge status={customer.status} />
              {account.overdueDebt > 0 && <Badge tone="danger">Deuda vencida</Badge>}
            </div>
            <div className="mt-2 grid gap-x-5 gap-y-1 text-sm text-muted-foreground sm:flex sm:flex-wrap">
              <span className="inline-flex items-center gap-1.5">
                <UserRound className="size-3.5" /> Propietario: <span className="text-foreground">{customer.ownerName}</span>
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="size-3.5" /> Zona: <span className="text-foreground">{customer.zone}</span>
              </span>
              <a href={`tel:+591${customer.phone}`} className="inline-flex items-center gap-1.5 hover:text-foreground">
                <Phone className="size-3.5" /> Teléfono: <span className="text-foreground tabular">{formatPhone(customer.phone)}</span>
              </a>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap lg:flex-nowrap lg:justify-end">
          <Button asChild className="col-span-2 sm:col-span-1">
            <Link href={`/pedidos/nuevo?cliente=${customer.id}`}>
              <Plus /> Nuevo pedido
            </Link>
          </Button>
          <Button variant="secondary" onClick={() => openPayment(customer.id)} disabled={account.currentDebt <= 0}>
            <HandCoins /> Registrar pago
          </Button>
          <Button variant="secondary" onClick={() => openReminder(customer.id)} disabled={account.currentDebt <= 0}>
            <BellRing /> Enviar recordatorio
          </Button>
          {role === "owner" && (
            <Button variant="ghost" onClick={() => setEditing(true)} className="col-span-2 sm:col-span-1">
              <Pencil /> Editar
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        <KpiCard label="Deuda actual" value={formatMoney(account.currentDebt)} icon={Wallet} hint={account.nextDueDate ? `Próx. vence ${formatLongDate(account.nextDueDate)}` : undefined} />
        <KpiCard
          label="Deuda vencida"
          value={formatMoney(account.overdueDebt)}
          tone={account.overdueDebt > 0 ? "danger" : "default"}
          hint={account.overdueDebt > 0 ? `Hace ${account.oldestOverdueDays} días` : "Al día"}
          className={cn(account.overdueDebt > 0 && "border-destructive/25 bg-destructive-soft/30")}
        />
        <KpiCard label="Límite de crédito" value={customer.creditLimit > 0 ? formatMoney(customer.creditLimit) : "Contado"} hint={`${customer.creditDays} días · ${customer.priceList}`} />
        <div className="rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5">
          <p className="text-[13px] font-medium text-muted-foreground">Crédito disponible</p>
          <p className="mt-2 text-[22px] leading-tight font-semibold tracking-tight tabular sm:text-2xl">{formatMoney(account.availableCredit)}</p>
          <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted" title={`${Math.round(usage)}% usado`}>
            <div className={cn("h-full rounded-full", usage > 90 ? "bg-destructive" : usage > 70 ? "bg-warning" : "bg-primary")} style={{ width: `${usage}%` }} />
          </div>
        </div>
        <KpiCard
          label="Último pago"
          value={account.lastPaymentDate ? formatLongDate(account.lastPaymentDate).replace(" de ", " ") : "—"}
          hint={account.lastPaymentDate ? formatMoney(account.lastPaymentAmount) : "Sin pagos registrados"}
          valueClassName="sm:text-xl text-lg"
          className="col-span-2 md:col-span-1"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="overflow-hidden lg:col-span-2">
          <Tabs defaultValue={pending.length ? "pending" : "history"}>
            <div className="border-b border-border px-4 pt-4 pb-3 sm:px-5">
              <TabsList>
                <TabsTrigger value="history">Historial de pedidos</TabsTrigger>
                <TabsTrigger value="pending">
                  Pendientes
                  {pending.length > 0 && <span className="rounded-full bg-primary px-1.5 text-[11px] text-white tabular">{pending.length}</span>}
                </TabsTrigger>
                <TabsTrigger value="account">Movimientos de cuenta</TabsTrigger>
              </TabsList>
            </div>
            <TabsContent value="history" className="mt-0">
              {orders.length ? (
                <OrdersTable orders={orders.slice(0, 15)} showCustomer={false} showItems />
              ) : (
                <EmptyState icon={ClipboardList} title="Este cliente aún no tiene pedidos" />
              )}
            </TabsContent>
            <TabsContent value="pending" className="mt-0">
              {pending.length ? (
                <OrdersTable orders={pending} showCustomer={false} showItems />
              ) : (
                <EmptyState icon={ClipboardList} title="Sin pedidos pendientes" description="Todos los pedidos de este cliente fueron entregados." />
              )}
            </TabsContent>
            <TabsContent value="account" className="mt-0">
              <AccountStatement customerId={customer.id} />
            </TabsContent>
          </Tabs>
        </Card>

        <div className="space-y-4">
          <CustomerSummary customerId={customer.id} />
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Notas</CardTitle>
              {role === "owner" && (
                <button type="button" onClick={() => setEditing(true)} className="text-[13px] font-medium text-primary hover:underline">
                  Editar
                </button>
              )}
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">{customer.notes || "Sin notas registradas."}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Datos del cliente</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="space-y-2.5 text-sm">
                {[
                  ["Dirección", customer.address],
                  ["Tipo", customer.customerType],
                  ["Lista de precios", customer.priceList],
                  ["Vendedor", seller?.name ?? "—"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="shrink-0 text-muted-foreground">{k}</dt>
                    <dd className="text-right">{v}</dd>
                  </div>
                ))}
              </dl>
            </CardContent>
          </Card>
        </div>
      </div>

      <CustomerFormDialog open={editing} onOpenChange={setEditing} customer={customer} />
    </div>
  );
}
