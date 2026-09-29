"use client";

import { AlertTriangle, Banknote, CreditCard, Info } from "lucide-react";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { formatMoney } from "@/lib/format";
import { useAccounts } from "@/lib/store/hooks";
import type { Customer, OrderChannel, PaymentType } from "@/lib/types";
import { cn } from "@/lib/utils";

export function creditCheck(limit: number, debt: number, orderTotal: number) {
  const projected = debt + orderTotal;
  return { projected, excess: Math.max(0, projected - limit) };
}

export function PaymentStep({
  customer,
  total,
  paymentType,
  onPaymentType,
  channel,
  onChannel,
  notes,
  onNotes,
}: {
  customer: Customer;
  total: number;
  paymentType: PaymentType;
  onPaymentType: (value: PaymentType) => void;
  channel: OrderChannel;
  onChannel: (value: OrderChannel) => void;
  notes: string;
  onNotes: (value: string) => void;
}) {
  const account = useAccounts().get(customer.id)!;
  const creditAllowed = customer.creditLimit > 0;
  const { projected, excess } = creditCheck(customer.creditLimit, account.currentDebt, total);

  const options: { value: PaymentType; label: string; description: string; icon: typeof Banknote; disabled?: boolean }[] = [
    { value: "cash", label: "Contado", description: "Se cobra al entregar", icon: Banknote },
    {
      value: "credit",
      label: "Crédito",
      description: creditAllowed ? `${customer.creditDays} días de plazo` : "Cliente sin crédito aprobado",
      icon: CreditCard,
      disabled: !creditAllowed,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-label="Condición de pago">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={paymentType === o.value}
            disabled={o.disabled}
            onClick={() => onPaymentType(o.value)}
            className={cn(
              "flex flex-col items-start gap-2 rounded-xl border-2 p-4 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-50",
              paymentType === o.value ? "border-primary bg-primary-soft/50" : "border-border bg-card hover:border-zinc-300",
            )}
          >
            <o.icon className={cn("size-5", paymentType === o.value ? "text-primary" : "text-muted-foreground")} />
            <span className="text-base font-semibold">{o.label}</span>
            <span className="text-xs text-muted-foreground">{o.description}</span>
          </button>
        ))}
      </div>

      {paymentType === "credit" && (
        <div className="rounded-xl border border-border bg-card">
          <dl className="divide-y divide-border text-sm">
            {[
              ["Límite de crédito", formatMoney(customer.creditLimit)],
              ["Deuda actual", formatMoney(account.currentDebt)],
              ["Pedido nuevo", `+ ${formatMoney(total)}`],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between px-4 py-2.5">
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="font-medium tabular">{v}</dd>
              </div>
            ))}
            <div className="flex justify-between px-4 py-3">
              <dt className="font-medium">Saldo proyectado</dt>
              <dd className={cn("text-base font-semibold tabular", excess > 0 && "text-destructive")}>{formatMoney(projected)}</dd>
            </div>
          </dl>
          {excess > 0 ? (
            <p className="flex items-start gap-2 border-t border-destructive/15 bg-destructive-soft px-4 py-3 text-sm text-destructive-soft-foreground rounded-b-xl">
              <AlertTriangle className="mt-0.5 size-4 shrink-0" />
              <span>
                Este pedido supera el límite de crédito del cliente en <strong className="tabular">{formatMoney(excess)}</strong>. Puedes confirmarlo igual o
                cobrar una parte al contado.
              </span>
            </p>
          ) : account.overdueDebt > 0 ? (
            <p className="flex items-start gap-2 border-t border-warning/20 bg-warning-soft px-4 py-3 text-sm text-warning-soft-foreground rounded-b-xl">
              <Info className="mt-0.5 size-4 shrink-0" />
              <span>
                El cliente tiene <strong className="tabular">{formatMoney(account.overdueDebt)}</strong> vencidos. Aprovecha la entrega para cobrar.
              </span>
            </p>
          ) : null}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-[180px_1fr]">
        <div className="grid gap-1.5">
          <label htmlFor="order-channel" className="text-sm font-medium">
            Canal
          </label>
          <NativeSelect id="order-channel" value={channel} onChange={(e) => onChannel(e.target.value as OrderChannel)}>
            <option value="seller">Vendedor en ruta</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="phone">Teléfono</option>
          </NativeSelect>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="order-notes" className="text-sm font-medium">
            Nota para almacén <span className="font-normal text-muted-foreground">(opcional)</span>
          </label>
          <Textarea id="order-notes" rows={1} className="min-h-9" value={notes} onChange={(e) => onNotes(e.target.value)} placeholder="Ej.: entregar antes de las 10:00" />
        </div>
      </div>
    </div>
  );
}
