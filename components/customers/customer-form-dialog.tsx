"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { applyServerErrors, useZodForm } from "@/hooks/use-zod-form";
import { createCustomer, updateCustomer } from "@/lib/actions/customers";
import { customerSchema } from "@/lib/validation/schemas";
import type { CustomerRow } from "@/types/database";

type Props = {
  customer?: CustomerRow;
  defaultOpen?: boolean;
  triggerProps?: ButtonProps;
};

export function CustomerFormDialog({ customer, defaultOpen = false, triggerProps }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const router = useRouter();
  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        // Drop ?new=1 so a refresh does not reopen the dialog.
        if (!v && defaultOpen) router.replace(window.location.pathname, { scroll: false });
      }}
    >
      <DialogTrigger asChild>
        {customer ? (
          <Button variant="secondary" {...triggerProps}>
            <Pencil /> Editar
          </Button>
        ) : (
          <Button {...triggerProps}>
            <Plus /> Nuevo cliente
          </Button>
        )}
      </DialogTrigger>
      <DialogContent size="lg">
        {open && (
          <CustomerForm
            customer={customer}
            onDone={(id) => {
              setOpen(false);
              if (!customer && id) router.push(`/dashboard/customers/${id}`);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CustomerForm({ customer, onDone }: { customer?: CustomerRow; onDone: (id?: string) => void }) {
  const [pending, startTransition] = useTransition();
  const form = useZodForm(customerSchema, {
    name: customer?.name ?? "",
    business_name: customer?.business_name ?? "",
    nit: customer?.nit ?? "",
    phone: customer?.phone ?? "",
    email: customer?.email ?? "",
    address: customer?.address ?? "",
    city: customer?.city ?? "La Paz",
    notes: customer?.notes ?? "",
    status: customer?.status ?? "active",
  });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const result = customer ? await updateCustomer(customer.id, values) : await createCustomer(values);
      if (!result.ok) {
        applyServerErrors(form, result);
        toast.error(result.error);
        return;
      }
      toast.success(result.message ?? "Guardado");
      onDone(result.data.id);
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="flex min-h-0 flex-col">
      <DialogHeader>
        <DialogTitle>{customer ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>El celular se usa para enviar recordatorios por WhatsApp.</DialogDescription>
      </DialogHeader>
      <DialogBody className="grid gap-4 sm:grid-cols-2">
        <Field id="c-name" label="Nombre o contacto" error={errors.name?.message} required className="sm:col-span-2">
          <Input placeholder="Ferretería Illimani" autoComplete="off" {...form.register("name")} />
        </Field>
        <Field id="c-business" label="Razón social" error={errors.business_name?.message}>
          <Input placeholder="Opcional" {...form.register("business_name")} />
        </Field>
        <Field id="c-nit" label="NIT" error={errors.nit?.message}>
          <Input inputMode="numeric" placeholder="Opcional" {...form.register("nit")} />
        </Field>
        <Field id="c-phone" label="Celular (WhatsApp)" error={errors.phone?.message} required hint="Ej.: 71234567 — agregamos +591 automáticamente.">
          <Input type="tel" inputMode="tel" placeholder="71234567" {...form.register("phone")} />
        </Field>
        <Field id="c-email" label="Correo" error={errors.email?.message}>
          <Input type="email" inputMode="email" placeholder="Opcional" {...form.register("email")} />
        </Field>
        <Field id="c-city" label="Ciudad" error={errors.city?.message}>
          <Input placeholder="La Paz" {...form.register("city")} />
        </Field>
        <Field id="c-address" label="Dirección" error={errors.address?.message}>
          <Input placeholder="Opcional" {...form.register("address")} />
        </Field>
        <Field id="c-notes" label="Notas internas" error={errors.notes?.message} className="sm:col-span-2">
          <Textarea rows={2} placeholder="Condiciones de pago, contacto de cobranza..." {...form.register("notes")} />
        </Field>
        {customer && (
          <Field id="c-status" label="Estado" error={errors.status?.message}>
            <NativeSelect {...form.register("status")}>
              <option value="active">Activo</option>
              <option value="inactive">Inactivo</option>
            </NativeSelect>
          </Field>
        )}
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={() => onDone()}>
          Cancelar
        </Button>
        <Button type="submit" loading={pending}>
          {customer ? "Guardar cambios" : "Crear cliente"}
        </Button>
      </DialogFooter>
    </form>
  );
}
