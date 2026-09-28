"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyServerErrors, useZodForm } from "@/hooks/use-zod-form";
import { updateOrganization } from "@/lib/actions/settings";
import { organizationSchema } from "@/lib/validation/schemas";
import type { OrganizationRow } from "@/types/database";

export function OrganizationForm({ organization, disabled }: { organization: OrganizationRow; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const form = useZodForm(organizationSchema, {
    name: organization.name,
    legal_name: organization.legal_name ?? "",
    nit: organization.nit ?? "",
    phone: organization.phone ?? "",
    address: organization.address ?? "",
    city: organization.city ?? "",
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const r = await updateOrganization(values);
      if (!r.ok) {
        applyServerErrors(form, r);
        toast.error(r.error);
      } else {
        toast.success(r.message);
        form.reset(values);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate>
      <fieldset disabled={disabled} className="grid gap-4 sm:grid-cols-2">
        <Field id="o-name" label="Nombre comercial" error={errors.name?.message} required hint="Aparece en los recordatorios y en la página de pago.">
          <Input {...form.register("name")} />
        </Field>
        <Field id="o-legal" label="Razón social" error={errors.legal_name?.message}>
          <Input {...form.register("legal_name")} />
        </Field>
        <Field id="o-nit" label="NIT" error={errors.nit?.message}>
          <Input inputMode="numeric" {...form.register("nit")} />
        </Field>
        <Field id="o-phone" label="Teléfono de contacto" error={errors.phone?.message}>
          <Input type="tel" {...form.register("phone")} />
        </Field>
        <Field id="o-address" label="Dirección" error={errors.address?.message}>
          <Input {...form.register("address")} />
        </Field>
        <Field id="o-city" label="Ciudad" error={errors.city?.message}>
          <Input {...form.register("city")} />
        </Field>
      </fieldset>
      {!disabled && (
        <div className="mt-5 flex justify-end">
          <Button type="submit" loading={pending} disabled={!isDirty}>
            Guardar cambios
          </Button>
        </div>
      )}
    </form>
  );
}
