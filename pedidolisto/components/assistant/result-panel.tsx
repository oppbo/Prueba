"use client";

import Link from "next/link";
import { AlertTriangle, Check, CheckCircle2, CircleDashed, Loader2, Minus, Pencil, Plus, Sparkles, Trash2, Truck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProductThumb } from "@/components/shared/product-thumb";
import { PaymentTypeBadge } from "@/components/shared/status-badges";
import type { ParsedOrder } from "@/lib/assistant/parser";
import type { AccountDetail } from "@/lib/domain/accounts";
import { formatMoney } from "@/lib/format";
import type { Customer, Order, PaymentType } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { OrderLine } from "@/components/order-form/use-order-lines";

export type Phase = "idle" | "processing" | "done" | "confirmed";

const STEPS = ["Leyendo el mensaje", "Identificando productos y cantidades", "Verificando precios, stock y crédito"];

export function ProcessingState({ step }: { step: number }) {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-primary-soft text-primary">
          <Sparkles className="size-5" />
        </span>
        <div>
          <p className="font-semibold">Interpretando pedido…</p>
          <p className="text-sm text-muted-foreground">Esto toma menos de un segundo.</p>
        </div>
      </div>
      <ul className="mt-5 space-y-3">
        {STEPS.map((label, i) => (
          <li key={label} className={cn("flex items-center gap-3 text-sm", i > step && "text-muted-foreground")}>
            {i < step ? <CheckCircle2 className="size-4 text-success" /> : i === step ? <Loader2 className="size-4 animate-spin text-primary" /> : <CircleDashed className="size-4" />}
            {label}
          </li>
        ))}
      </ul>
    </Card>
  );
}

export function IdleState() {
  return (
    <Card className="flex h-full min-h-[320px] flex-col items-center justify-center p-8 text-center">
      <span className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
        <Sparkles className="size-6" />
      </span>
      <p className="mt-4 font-semibold">El pedido aparecerá aquí</p>
      <p className="mt-1 max-w-xs text-sm text-muted-foreground">
        Presiona <strong>Interpretar pedido</strong> y PedidoListo convertirá el mensaje en un pedido listo para confirmar.
      </p>
    </Card>
  );
}

export function DetectedOrder({
  customer,
  account,
  parsed,
  lines,
  subtotal,
  total,
  paymentType,
  onPaymentType,
  onQuantity,
  onConfirm,
  onEdit,
  onDiscard,
}: {
  customer: Customer;
  account: AccountDetail;
  parsed: ParsedOrder;
  lines: OrderLine[];
  subtotal: number;
  total: number;
  paymentType: PaymentType;
  onPaymentType: (p: PaymentType) => void;
  onQuantity: (productId: string, quantity: number) => void;
  onConfirm: () => void;
  onEdit: () => void;
  onDiscard: () => void;
}) {
  const projected = account.currentDebt + total;
  const excess = paymentType === "credit" ? Math.max(0, projected - customer.creditLimit) : 0;
  const stockIssues = lines.filter((l) => l.quantity > l.product.stock);
  const sourceFor = (productId: string) => parsed.lines.find((l) => l.productId === productId);

  return (
    <Card className="overflow-hidden animate-in">
      <div className="flex items-center justify-between gap-3 border-b border-border bg-success-soft/60 px-5 py-3.5">
        <div className="flex items-center gap-2.5">
          <CheckCircle2 className="size-5 text-success" />
          <p className="font-semibold">Pedido detectado</p>
        </div>
        <Badge tone="success">{lines.length} productos</Badge>
      </div>

      <div className="space-y-5 p-5">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-muted-foreground">Cliente</p>
            <p className="mt-0.5 font-semibold">{customer.businessName}</p>
            <p className="text-xs text-muted-foreground">{customer.priceList}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Entrega</p>
            <p className="mt-0.5 flex items-center gap-1.5 font-semibold">
              <Truck className="size-4 text-muted-foreground" /> {parsed.delivery === "today" ? "Hoy" : "Mañana"}
            </p>
            {!parsed.delivery && <p className="text-xs text-muted-foreground">No indicada · siguiente reparto</p>}
          </div>
        </div>

        {parsed.usedPrevious && (
          <p className="rounded-lg bg-info-soft px-3 py-2 text-sm text-info-soft-foreground">
            Se tomó como base el pedido anterior <strong>{parsed.previousOrderNumber}</strong>
            {parsed.removed.length > 0 && <> y se quitó lo indicado</>}.
          </p>
        )}

        <div>
          <p className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">Productos detectados</p>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {lines.map((l) => {
              const src = sourceFor(l.productId);
              return (
                <li key={l.productId} className="flex items-center gap-3 px-3 py-2.5">
                  <ProductThumb product={l.product} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.product.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {src?.origin === "previous" ? "Del pedido anterior" : src ? `“${src.source}”` : ""} · {formatMoney(l.unitPrice)} c/u
                    </p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button type="button" className="grid size-7 place-items-center rounded-md border border-border hover:bg-muted" onClick={() => onQuantity(l.productId, l.quantity - 1)} aria-label="Quitar uno">
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold tabular">{l.quantity}</span>
                    <button type="button" className="grid size-7 place-items-center rounded-md border border-border hover:bg-muted" onClick={() => onQuantity(l.productId, l.quantity + 1)} aria-label="Agregar uno">
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                  <p className="w-20 text-right text-sm font-semibold tabular">{formatMoney(l.subtotal)}</p>
                </li>
              );
            })}
            {parsed.removed.map((r) => (
              <li key={`rm-${r.productId}`} className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
                <Trash2 className="ml-2 size-4" />
                <span className="flex-1 line-through">{r.source.replace(/^sin /, "")}</span>
                <span className="text-xs">Quitado · “{r.source}”</span>
              </li>
            ))}
          </ul>
          {parsed.unknown.length > 0 && (
            <p className="mt-2 text-xs text-warning">No reconocido: {parsed.unknown.map((u) => `“${u}”`).join(", ")}. Revísalo en Editar.</p>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Condición detectada</p>
            <div className="mt-1 flex items-center gap-2">
              <PaymentTypeBadge type={paymentType} />
              <span className="text-xs text-muted-foreground">{parsed.paymentSource ? `por “${parsed.paymentSource}”` : "no mencionada · por defecto"}</span>
            </div>
          </div>
          {customer.creditLimit > 0 && (
            <div className="flex rounded-md border border-border p-0.5 text-xs font-medium">
              {(["cash", "credit"] as const).map((p) => (
                <button key={p} type="button" onClick={() => onPaymentType(p)} className={cn("rounded px-2.5 py-1", paymentType === p ? "bg-foreground text-background" : "text-muted-foreground")}>
                  {p === "cash" ? "Contado" : "Crédito"}
                </button>
              ))}
            </div>
          )}
        </div>

        <dl className="space-y-2 rounded-lg bg-muted/50 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Subtotal</dt>
            <dd className="tabular">{formatMoney(subtotal)}</dd>
          </div>
          <div className="flex items-baseline justify-between">
            <dt className="font-medium">Total</dt>
            <dd className="text-xl font-semibold tabular">{formatMoney(total)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2">
            <dt className="text-muted-foreground">Deuda anterior</dt>
            <dd className="tabular">{formatMoney(account.currentDebt)}</dd>
          </div>
          {paymentType === "credit" && (
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Saldo proyectado</dt>
              <dd className={cn("font-semibold tabular", excess > 0 && "text-destructive")}>{formatMoney(projected)}</dd>
            </div>
          )}
        </dl>

        {excess > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Este pedido supera el límite de crédito del cliente en {formatMoney(excess)}.
          </p>
        )}
        {account.overdueDebt > 0 && paymentType === "credit" && excess === 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> El cliente tiene {formatMoney(account.overdueDebt)} vencidos.
          </p>
        )}
        {stockIssues.length > 0 && (
          <p className="flex items-start gap-2 rounded-lg bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" /> Stock insuficiente: {stockIssues.map((l) => `${l.product.shortName} (${l.product.stock})`).join(", ")}.
          </p>
        )}

        <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
          <Button size="lg" onClick={onConfirm} disabled={!lines.length} className="font-semibold tracking-wide uppercase">
            <Check /> Confirmar pedido
          </Button>
          <Button size="lg" variant="secondary" onClick={onEdit} disabled={!lines.length}>
            <Pencil /> Editar
          </Button>
          <Button size="lg" variant="ghost" onClick={onDiscard}>
            <Trash2 /> Descartar
          </Button>
        </div>
      </div>
    </Card>
  );
}

export function ConfirmedState({ order, onReset }: { order: Order; onReset: () => void }) {
  return (
    <Card className="p-6 text-center animate-in">
      <span className="mx-auto grid size-12 place-items-center rounded-full bg-success-soft text-success">
        <CheckCircle2 className="size-6" />
      </span>
      <p className="mt-4 text-lg font-semibold">Pedido {order.number} creado</p>
      <p className="mt-1 text-sm text-muted-foreground">
        {formatMoney(order.total)} · ya aparece en Almacén para preparar. Tiempo total: segundos, sin volver a digitar nada.
      </p>
      <div className="mt-5 grid gap-2 sm:grid-cols-2">
        <Button asChild>
          <Link href={`/pedidos/${order.id}`}>Ver pedido</Link>
        </Button>
        <Button variant="secondary" onClick={onReset}>
          Probar otro mensaje
        </Button>
      </div>
    </Card>
  );
}
