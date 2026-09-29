"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { Avatar } from "@/components/shared/avatar";
import { PAYMENT_METHOD } from "@/lib/labels";
import { formatMoney } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useAccounts, useCurrentUser, useData } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import type { ID, PaymentMethod } from "@/lib/types";
import { cn, round2 } from "@/lib/utils";

const METHODS: PaymentMethod[] = ["cash", "transfer", "deposit", "other"];

function todayInput(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function inputToIso(value: string): string {
  const [y, m, d] = value.split("-").map(Number);
  const now = new Date();
  const date = new Date(y, m - 1, d, now.getHours(), now.getMinutes(), now.getSeconds());
  return date.toISOString();
}

export function PaymentDialog() {
  const paymentFor = useUiStore((s) => s.paymentFor);
  const close = useUiStore((s) => s.closePayment);
  const open = paymentFor !== undefined;
  return (
    <Dialog open={open} onOpenChange={(v) => !v && close()}>
      <DialogContent size="md">
        {open && <PaymentForm key={paymentFor ?? "new"} initialCustomerId={paymentFor ?? ""} onDone={close} />}
      </DialogContent>
    </Dialog>
  );
}

function PaymentForm({ initialCustomerId, onDone }: { initialCustomerId: ID; onDone: () => void }) {
  const data = useData();
  const accounts = useAccounts();
  const user = useCurrentUser();
  const registerPayment = useDemoStore((s) => s.registerPayment);

  const [customerId, setCustomerId] = useState(initialCustomerId);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const [date, setDate] = useState(todayInput());
  const [notes, setNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const debtors = useMemo(
    () =>
      data.customers
        .filter((c) => (accounts.get(c.id)?.currentDebt ?? 0) > 0 || c.id === initialCustomerId)
        .sort((a, b) => a.businessName.localeCompare(b.businessName)),
    [data.customers, accounts, initialCustomerId],
  );
  const customer = data.customers.find((c) => c.id === customerId);
  const account = customer ? accounts.get(customer.id) : undefined;
  const debt = account?.currentDebt ?? 0;
  const value = Number(amount.replace(",", "."));
  const validAmount = Number.isFinite(value) && value > 0;

  const errors = {
    customer: !customer ? "Selecciona un cliente." : undefined,
    amount: !validAmount
      ? "Ingresa un monto mayor a cero."
      : value > debt + 0.009
        ? `El monto supera la deuda actual (${formatMoney(debt)}).`
        : undefined,
    date: !date ? "Selecciona la fecha del pago." : date > todayInput() ? "La fecha no puede ser futura." : undefined,
  };
  const hasErrors = Object.values(errors).some(Boolean);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (hasErrors || !customer) return;
    try {
      registerPayment({ customerId: customer.id, amount: round2(value), method, date: inputToIso(date), notes, salespersonId: user.salespersonId });
      toast.success(`Pago de ${formatMoney(value)} registrado`, {
        description: `${customer.businessName} · nuevo saldo ${formatMoney(Math.max(debt - value, 0))}`,
      });
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo registrar el pago.");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
      <DialogHeader>
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogDescription>El saldo del cliente se actualiza al instante.</DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        {initialCustomerId && customer ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 p-3">
            <Avatar name={customer.businessName} />
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{customer.businessName}</p>
              <p className="truncate text-xs text-muted-foreground">
                {customer.ownerName} · {customer.zone}
              </p>
            </div>
          </div>
        ) : (
          <Field id="pay-customer" label="Cliente" required error={submitted ? errors.customer : undefined}>
            <NativeSelect value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
              <option value="">Selecciona un cliente con deuda…</option>
              {debtors.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.businessName} — {formatMoney(accounts.get(c.id)?.currentDebt ?? 0)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}

        <Field id="pay-amount" label="Monto (Bs)" required error={submitted || amount ? errors.amount : undefined}>
          <Input inputMode="decimal" placeholder="0,00" value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))} className="h-11 text-lg font-semibold tabular" autoFocus={!!initialCustomerId} />
        </Field>
        {account && debt > 0 && (
          <div className="-mt-2 flex flex-wrap gap-1.5">
            {account.overdueDebt > 0 && account.overdueDebt < debt && (
              <button type="button" className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted" onClick={() => setAmount(String(account.overdueDebt))}>
                Vencido · {formatMoney(account.overdueDebt)}
              </button>
            )}
            <button type="button" className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted" onClick={() => setAmount(String(debt))}>
              Total · {formatMoney(debt)}
            </button>
            {debt > 1000 && (
              <button type="button" className="rounded-full border border-border px-2.5 py-1 text-xs font-medium hover:bg-muted" onClick={() => setAmount("1000")}>
                Bs 1.000
              </button>
            )}
          </div>
        )}

        <div className="grid gap-1.5">
          <span className="text-sm font-medium">Método de pago</span>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4" role="radiogroup" aria-label="Método de pago">
            {METHODS.map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={method === m}
                onClick={() => setMethod(m)}
                className={cn(
                  "h-10 rounded-md border text-sm font-medium transition-colors",
                  method === m ? "border-primary bg-primary-soft text-primary-soft-foreground" : "border-border hover:bg-muted",
                )}
              >
                {PAYMENT_METHOD[m]}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pay-date" label="Fecha" required error={errors.date}>
            <Input type="date" value={date} max={todayInput()} onChange={(e) => setDate(e.target.value)} />
          </Field>
          <Field id="pay-notes" label="Nota (opcional)">
            <Textarea rows={1} className="min-h-9" placeholder="Ej.: Nro. de transferencia" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </Field>
        </div>

        {customer && (
          <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 rounded-lg border border-border bg-muted/40 p-3 text-center">
            <div>
              <p className="text-[11px] text-muted-foreground">Saldo antes</p>
              <p className="text-sm font-semibold tabular">{formatMoney(debt)}</p>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">Pago</p>
              <p className="text-sm font-semibold text-success tabular">{validAmount ? `−${formatMoney(value)}` : "—"}</p>
            </div>
            <ArrowRight className="size-3.5 text-muted-foreground" />
            <div>
              <p className="text-[11px] text-muted-foreground">Saldo después</p>
              <p className="text-sm font-semibold tabular">{formatMoney(Math.max(debt - (validAmount ? value : 0), 0))}</p>
            </div>
          </div>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" className="sm:min-w-40">
          Registrar pago
        </Button>
      </DialogFooter>
    </form>
  );
}
