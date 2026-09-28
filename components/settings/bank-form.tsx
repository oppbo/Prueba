"use client";

import { useRef, useState, useTransition } from "react";
import { ImageUp, QrCode, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { applyServerErrors, useZodForm } from "@/hooks/use-zod-form";
import { removeBankQr, updateBankDetails, uploadBankQr } from "@/lib/actions/settings";
import { bankSchema } from "@/lib/validation/schemas";
import type { OrganizationRow } from "@/types/database";

const QR_TYPES = ["image/png", "image/jpeg", "image/webp"];

export function BankForm({ organization, qrUrl, disabled }: { organization: OrganizationRow; qrUrl: string | null; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const [qrPending, startQr] = useTransition();
  const [preview, setPreview] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const form = useZodForm(bankSchema, {
    bank_name: organization.bank_name ?? "",
    bank_account_name: organization.bank_account_name ?? "",
    bank_account_number: organization.bank_account_number ?? "",
  });
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const r = await updateBankDetails(values);
      if (!r.ok) {
        applyServerErrors(form, r);
        toast.error(r.error);
      } else {
        toast.success(r.message);
        form.reset(values);
      }
    }),
  );

  function onQrSelected(file: File | undefined) {
    if (!file) return;
    if (!QR_TYPES.includes(file.type)) return toast.error("Sube una imagen PNG, JPG o WebP.");
    if (file.size > 2 * 1024 * 1024) return toast.error("La imagen supera 2 MB.");
    const localUrl = URL.createObjectURL(file);
    setPreview(localUrl);
    const data = new FormData();
    data.set("qr", file);
    startQr(async () => {
      const r = await uploadBankQr(data);
      if (!r.ok) {
        toast.error(r.error);
        setPreview(null);
      } else toast.success("QR actualizado. Ya aparece en tus páginas de pago.");
      if (inputRef.current) inputRef.current.value = "";
    });
  }

  const shown = preview ?? qrUrl;

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_240px]">
      <form onSubmit={onSubmit} noValidate>
        <fieldset disabled={disabled} className="grid gap-4">
          <Field id="b-bank" label="Banco" error={errors.bank_name?.message}>
            <Input placeholder="Banco Unión, BNB, Banco Mercantil Santa Cruz…" {...form.register("bank_name")} />
          </Field>
          <Field id="b-holder" label="Titular de la cuenta" error={errors.bank_account_name?.message}>
            <Input {...form.register("bank_account_name")} />
          </Field>
          <Field id="b-number" label="Nro. de cuenta" error={errors.bank_account_number?.message} hint="Opcional. Se muestra con botón de copiar.">
            <Input inputMode="numeric" {...form.register("bank_account_number")} />
          </Field>
        </fieldset>
        {!disabled && (
          <div className="mt-5 flex justify-end">
            <Button type="submit" loading={pending} disabled={!isDirty}>
              Guardar datos de pago
            </Button>
          </div>
        )}
      </form>

      <div>
        <p className="text-sm font-medium">QR de cobro</p>
        <p className="mt-0.5 text-[13px] text-muted-foreground">La imagen del QR que te da tu banco. PNG, JPG o WebP, máx. 2 MB.</p>
        <div className="mt-3 flex aspect-square items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/50">
          {shown ? (
            // eslint-disable-next-line @next/next/no-img-element -- signed URL / local preview
            <img src={shown} alt="QR de cobro de tu empresa" className="size-full object-contain p-3" />
          ) : (
            <div className="flex flex-col items-center gap-2 text-muted-foreground">
              <QrCode className="size-8" aria-hidden />
              <span className="text-xs">Sin QR</span>
            </div>
          )}
        </div>
        {!disabled && (
          <div className="mt-3 flex gap-2">
            <input ref={inputRef} id="qr-file" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => onQrSelected(e.target.files?.[0])} />
            <Button type="button" variant="secondary" size="sm" className="flex-1" loading={qrPending} onClick={() => inputRef.current?.click()}>
              {!qrPending && <ImageUp />} {shown ? "Cambiar QR" : "Subir QR"}
            </Button>
            {qrUrl && !qrPending && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Eliminar QR"
                onClick={() =>
                  startQr(async () => {
                    const r = await removeBankQr();
                    if (r.ok) {
                      setPreview(null);
                      toast.success("QR eliminado");
                    } else toast.error(r.error);
                  })
                }
              >
                <Trash2 />
                <span className="sr-only">Eliminar QR</span>
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
