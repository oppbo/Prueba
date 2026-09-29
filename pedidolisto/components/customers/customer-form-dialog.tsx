"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Input, NativeSelect, Textarea } from "@/components/ui/input";
import { PRICE_LISTS } from "@/lib/domain/pricing";
import { ZONES, salespersonForZone } from "@/lib/mock/salespeople";
import { useDemoStore } from "@/lib/store/demo-store";
import { useData } from "@/lib/store/hooks";
import type { Customer, CustomerType } from "@/lib/types";
import type { CustomerInput } from "@/lib/services/customers";

const TYPES: CustomerType[] = ["Tienda de barrio", "Minimarket", "Supermercado", "Mayorista", "Kiosco", "Restaurante"];

type Errors = Partial<Record<keyof CustomerInput, string>>;

function validate(v: CustomerInput): Errors {
  const e: Errors = {};
  if (v.businessName.trim().length < 3) e.businessName = "Ingresa el nombre comercial.";
  if (v.ownerName.trim().length < 3) e.ownerName = "Ingresa el nombre del propietario.";
  if (!/^[67]\d{7}$/.test(v.phone.replace(/\D/g, ""))) e.phone = "Celular de 8 dígitos que empiece con 6 o 7.";
  if (v.address.trim().length < 4) e.address = "Ingresa una dirección de referencia.";
  if (!(v.creditLimit >= 0)) e.creditLimit = "Ingresa un monto válido (0 si solo compra al contado).";
  return e;
}

export function CustomerFormDialog({
  open,
  onOpenChange,
  customer,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">{open && <CustomerForm customer={customer} onDone={() => onOpenChange(false)} />}</DialogContent>
    </Dialog>
  );
}

function CustomerForm({ customer, onDone }: { customer?: Customer; onDone: () => void }) {
  const data = useData();
  const router = useRouter();
  const createCustomer = useDemoStore((s) => s.createCustomer);
  const updateCustomer = useDemoStore((s) => s.updateCustomer);
  const [values, setValues] = useState<CustomerInput>(() => ({
    businessName: customer?.businessName ?? "",
    ownerName: customer?.ownerName ?? "",
    phone: customer?.phone ?? "",
    zone: customer?.zone ?? "Villa Fátima",
    address: customer?.address ?? "",
    customerType: customer?.customerType ?? "Tienda de barrio",
    priceList: customer?.priceList ?? "Mayorista B",
    creditLimit: customer?.creditLimit ?? 0,
    salespersonId: customer?.salespersonId ?? "s1",
    notes: customer?.notes ?? "",
  }));
  const [submitted, setSubmitted] = useState(false);
  const errors = submitted ? validate(values) : {};
  const set = <K extends keyof CustomerInput>(key: K, value: CustomerInput[K]) => setValues((v) => ({ ...v, [key]: value }));

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (Object.keys(validate(values)).length) return;
    try {
      if (customer) {
        updateCustomer(customer.id, values);
        toast.success("Cliente actualizado");
      } else {
        const id = createCustomer(values);
        toast.success(`${values.businessName} fue agregado a tus clientes`);
        router.push(`/clientes/${id}`);
      }
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo guardar el cliente.");
    }
  };

  return (
    <form onSubmit={submit} noValidate className="flex min-h-0 flex-col">
      <DialogHeader>
        <DialogTitle>{customer ? "Editar cliente" : "Nuevo cliente"}</DialogTitle>
        <DialogDescription>Datos comerciales, de contacto y condiciones de crédito.</DialogDescription>
      </DialogHeader>
      <DialogBody className="grid gap-4 sm:grid-cols-2">
        <Field id="c-business" label="Nombre comercial" required error={errors.businessName}>
          <Input value={values.businessName} onChange={(e) => set("businessName", e.target.value)} placeholder="Ej.: Tienda Don José" autoFocus />
        </Field>
        <Field id="c-owner" label="Propietario" required error={errors.ownerName}>
          <Input value={values.ownerName} onChange={(e) => set("ownerName", e.target.value)} placeholder="Nombre y apellido" />
        </Field>
        <Field id="c-phone" label="Celular" required error={errors.phone}>
          <Input inputMode="tel" value={values.phone} onChange={(e) => set("phone", e.target.value.replace(/[^\d ]/g, "").slice(0, 9))} placeholder="71234567" />
        </Field>
        <Field id="c-type" label="Tipo de cliente">
          <NativeSelect value={values.customerType} onChange={(e) => set("customerType", e.target.value as CustomerType)}>
            {TYPES.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="c-zone" label="Zona">
          <NativeSelect
            value={values.zone}
            onChange={(e) => setValues((v) => ({ ...v, zone: e.target.value, salespersonId: customer ? v.salespersonId : salespersonForZone(e.target.value) }))}
          >
            {ZONES.map((z) => (
              <option key={z}>{z}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="c-seller" label="Vendedor asignado">
          <NativeSelect value={values.salespersonId} onChange={(e) => set("salespersonId", e.target.value)}>
            {data.salespeople.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="c-address" label="Dirección" required error={errors.address} className="sm:col-span-2">
          <Input value={values.address} onChange={(e) => set("address", e.target.value)} placeholder="Calle, número y referencia" />
        </Field>
        <Field id="c-pricelist" label="Lista de precios">
          <NativeSelect value={values.priceList} onChange={(e) => set("priceList", e.target.value as CustomerInput["priceList"])}>
            {PRICE_LISTS.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </NativeSelect>
        </Field>
        <Field id="c-credit" label="Límite de crédito (Bs)" error={errors.creditLimit} hint="0 = solo contado">
          <Input inputMode="numeric" value={String(values.creditLimit)} onChange={(e) => set("creditLimit", Number(e.target.value.replace(/\D/g, "")) || 0)} />
        </Field>
        <Field id="c-notes" label="Notas" className="sm:col-span-2">
          <Textarea rows={2} value={values.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Horarios de entrega, referencias, preferencias..." />
        </Field>
      </DialogBody>
      <DialogFooter>
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancelar
        </Button>
        <Button type="submit">{customer ? "Guardar cambios" : "Crear cliente"}</Button>
      </DialogFooter>
    </form>
  );
}
