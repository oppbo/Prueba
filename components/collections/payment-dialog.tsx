"use client";

import { useState, useTransition } from "react";
import { Banknote } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { recordPayment } from "@/lib/actions/collections";
import { formatBs, formatNumberBo, todayBo } from "@/lib/format";
import { PAYMENT_METHOD } from "@/lib/labels";
import { PAYMENT_METHODS, recordPaymentSchema } from "@/lib/validation/schemas";
import type { CollectibleInvoice } from "./types";
import { applyServerErrors, useZodForm } from "@/hooks/use-zod-form";

export function PaymentDialog({
  invoice,
  triggerLabel = "Registrar pago",
  triggerProps,
}: {
  invoice: Pick<CollectibleInvoice, "id" | "invoice_number" | "customer_name" | "outstanding_amount">;
  triggerLabel?: string;
  triggerProps?: ButtonProps;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" {...triggerProps}>
          <Banknote />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">{open && <PaymentForm invoice={invoice} onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  );
}

function PaymentForm({ invoice, onDone }: { invoice: Parameters<typeof PaymentDialog>[0]["invoice"]; onDone: () => void }) {
  const [pending, startTransition] = useTransition();
  const form = useZodForm(recordPaymentSchema, {
    invoice_id: invoice.id,
    amount: formatNumberBo(invoice.outstanding_amount),
    payment_date: todayBo(),
    payment_method: "bank_transfer",
    reference: "",
    notes: "",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const result = await recordPayment(form.getValues());
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success(
        result.data.outstanding > 0
          ? `Pago registrado. Saldo pendiente: ${formatBs(result.data.outstanding)}`
          : "Pago registrado. La factura quedó pagada.",
      );
      onDone();
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <DialogHeader>
        <DialogTitle>Registrar pago</DialogTitle>
        <DialogDescription>
          Factura {invoice.invoice_number} · {invoice.customer_name}. Saldo {formatBs(invoice.outstanding_amount)}.
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="grid gap-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="pay-amount" label="Monto (Bs)" error={errors.amount?.message} required>
            <Input inputMode="decimal" autoComplete="off" {...form.register("amount")} />
          </Field>
          <Field id="pay-date" label="Fecha de pago" error={errors.payment_date?.message} required>
            <Input type="date" max={todayBo()} {...form.register("payment_date")} />
          </Field>
        </div>
        <Field id="pay-method" label="Método" error={errors.payment_method?.message}>
          <NativeSelect {...form.register("payment_method")}>
            {PAYMENT_METHODS.map((m) => (
              <option key={m} value={m}>
                {PAYMENT_METHOD[m]}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="pay-reference" label="Referencia / Nro. de transacción" error={errors.reference?.message}>
          <Input placeholder="Opcional" {...form.register("reference")} />
        </Field>
        <Field id="pay-notes" label="Notas" error={errors.notes?.message}>
          <Textarea rows={2} placeholder="Opcional" {...form.register("notes")} />
        </Field>
        <p className="text-xs text-muted-foreground">El pago se registra como verificado y descuenta el saldo de la factura.</p>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          Registrar pago
        </Button>
      </DialogFooter>
    </form>
  );
}
