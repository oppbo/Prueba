"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { applyServerErrors, useZodForm } from "@/hooks/use-zod-form";
import { createInvoice, updateInvoice } from "@/lib/actions/invoices";
import { addDaysIso, formatNumberBo, todayBo } from "@/lib/format";
import { invoiceSchema } from "@/lib/validation/schemas";
import type { InvoiceRow } from "@/types/database";

export type CustomerOption = { id: string; name: string; business_name: string | null; status: string };

type Props = {
  customers: CustomerOption[];
  invoice?: Pick<InvoiceRow, "id" | "customer_id" | "invoice_number" | "description" | "issue_date" | "due_date" | "original_amount" | "notes">;
  defaultCustomerId?: string;
  defaultOpen?: boolean;
  triggerLabel?: string;
  triggerProps?: ButtonProps;
};

export function InvoiceFormDialog({ customers, invoice, defaultCustomerId, defaultOpen = false, triggerLabel, triggerProps }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v && defaultOpen) router.replace(window.location.pathname, { scroll: false });
      }}
    >
      <DialogTrigger asChild>
        {invoice ? (
          <Button variant="secondary" {...triggerProps}>
            <Pencil /> {triggerLabel ?? "Editar"}
          </Button>
        ) : (
          <Button {...triggerProps}>
            <Plus /> {triggerLabel ?? "Nueva factura"}
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        {open && (
          <InvoiceForm
            customers={customers}
            invoice={invoice}
            defaultCustomerId={defaultCustomerId}
            onDone={(id) => {
              setOpen(false);
              if (!invoice && id) router.push(`/dashboard/invoices/${id}`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function InvoiceForm({
  customers,
  invoice,
  defaultCustomerId,
  onDone,
}: Pick<Props, "customers" | "invoice" | "defaultCustomerId"> & { onDone: (id?: string) => void }) {
  const [pending, startTransition] = useTransition();
  const today = todayBo();
  const form = useZodForm(invoiceSchema, {
    customer_id: invoice?.customer_id ?? defaultCustomerId ?? "",
    invoice_number: invoice?.invoice_number ?? "",
    description: invoice?.description ?? "",
    issue_date: invoice?.issue_date ?? today,
    due_date: invoice?.due_date ?? addDaysIso(today, 30),
    amount: invoice ? formatNumberBo(invoice.original_amount) : "",
    notes: invoice?.notes ?? "",
  });
  const { errors } = form.formState;
  const selectable = customers.filter((c) => c.status === "active" || c.id === invoice?.customer_id || c.id === defaultCustomerId);

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const result = invoice ? await updateInvoice(invoice.id, values) : await createInvoice(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Guardado");
      onDone(result.data.id);
    }),
  );

  if (customers.length === 0) {
    return (
      <>
        <DialogHeader>
          <DialogTitle>Primero agrega un cliente</DialogTitle>
          <DialogDescription>Cada factura pertenece a un cliente. Crea uno o importa tu cartera desde CSV.</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button asChild variant="secondary">
            <Link href="/dashboard/import">Importar CSV</Link>
          </Button>
          <Button asChild>
            <Link href="/dashboard/customers?new=1">Nuevo cliente</Link>
          </Button>
        </DialogFooter>
      </>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
      <DialogHeader>
        <DialogTitle>{invoice ? `Editar factura ${invoice.invoice_number}` : "Nueva factura"}</DialogTitle>
        <DialogDescription>Registra una venta al crédito para hacerle seguimiento.</DialogDescription>
      </DialogHeader>
      <DialogBody className="grid gap-4 sm:grid-cols-2">
        <Field id="i-customer" label="Cliente" error={errors.customer_id?.message} required className="sm:col-span-2">
          <NativeSelect {...form.register("customer_id")}>
            <option value="">Selecciona un cliente…</option>
            {selectable.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.business_name ? ` — ${c.business_name}` : ""}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="i-number" label="Nro. de factura" error={errors.invoice_number?.message} required>
          <Input placeholder="F-001245" autoComplete="off" {...form.register("invoice_number")} />
        </Field>
        <Field id="i-amount" label="Monto total (Bs)" error={errors.amount?.message} required>
          <Input inputMode="decimal" placeholder="2.450,00" autoComplete="off" {...form.register("amount")} />
        </Field>
        <Field id="i-issue" label="Fecha de emisión" error={errors.issue_date?.message} required>
          <Input type="date" {...form.register("issue_date")} />
        </Field>
        <Field id="i-due" label="Fecha de vencimiento" error={errors.due_date?.message} required>
          <Input type="date" {...form.register("due_date")} />
        </Field>
        <Field id="i-description" label="Descripción" error={errors.description?.message} className="sm:col-span-2">
          <Input placeholder="Ej.: 40 bolsas de cemento IP-30" {...form.register("description")} />
        </Field>
        <Field id="i-notes" label="Notas internas" error={errors.notes?.message} className="sm:col-span-2">
          <Textarea rows={2} placeholder="Opcional" {...form.register("notes")} />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={() => onDone()}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          {invoice ? "Guardar cambios" : "Crear factura"}
        </Button>
      </DialogFooter>
    </form>
  );
}
