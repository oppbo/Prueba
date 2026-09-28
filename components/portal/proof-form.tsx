"use client";

import { useRef, useState, useTransition } from "react";
import { CheckCircle2, FileUp, Paperclip, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input, Textarea } from "@/components/ui/input";
import { submitPaymentProof } from "@/lib/actions/portal";
import { formatNumberBo, parseAmount } from "@/lib/format";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

export function ProofForm({ token, suggestedAmount }: { token: string; suggestedAmount: number }) {
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  if (done) {
    return (
      <div className="rounded-2xl border border-primary/20 bg-primary-soft p-6 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-primary" aria-hidden />
        <p className="mt-3 text-lg font-semibold text-primary-soft-foreground">Comprobante recibido</p>
        <p className="mt-1 text-sm text-primary-soft-foreground/80">Estamos verificando tu pago. Te contactaremos si necesitamos algo más.</p>
      </div>
    );
  }

  if (!open) {
    return (
      <Button size="lg" className="h-12 w-full text-base" onClick={() => setOpen(true)}>
        Ya realicé el pago
      </Button>
    );
  }

  function onFile(f: File | undefined) {
    if (!f) return;
    const next: Record<string, string> = { ...errors };
    delete next.proof;
    if (f.size > MAX_BYTES) next.proof = "El archivo supera 5 MB.";
    else if (!ACCEPT.split(",").includes(f.type)) next.proof = "Sube una imagen JPG o PNG, o un PDF.";
    setErrors(next);
    setFile(next.proof ? null : f);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const nextErrors: Record<string, string> = {};
    const amount = parseAmount(String(data.get("amount") ?? ""));
    if (!Number.isFinite(amount) || amount <= 0) nextErrors.amount = "Ingresa el monto que pagaste";
    if (!file) nextErrors.proof = "Adjunta la foto o PDF de tu comprobante";
    setErrors(nextErrors);
    setFormError(null);
    if (Object.keys(nextErrors).length) return;
    data.set("proof", file as File);
    startTransition(async () => {
      const result = await submitPaymentProof(token, data);
      if (result.ok) setDone(true);
      else {
        setErrors(result.fieldErrors ?? {});
        setFormError(result.error);
      }
    });
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl border border-border bg-card p-5 shadow-xs" noValidate>
      <div>
        <h2 className="text-base font-semibold">Envía tu comprobante</h2>
        <p className="mt-0.5 text-sm text-muted-foreground">Foto o captura de la transferencia (JPG, PNG o PDF, máx. 5 MB).</p>
      </div>

      <div className="grid gap-1.5">
        <span className="text-sm font-medium" id="proof-label">
          Comprobante<span className="ml-0.5 text-destructive" aria-hidden>*</span>
        </span>
        <input ref={inputRef} type="file" accept={ACCEPT} className="sr-only" id="proof" aria-labelledby="proof-label" onChange={(e) => onFile(e.target.files?.[0])} />
        {file ? (
          <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/50 px-3 py-2.5 text-sm">
            <Paperclip className="size-4 text-muted-foreground" aria-hidden />
            <span className="min-w-0 flex-1 truncate">{file.name}</span>
            <button
              type="button"
              onClick={() => {
                setFile(null);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
              <span className="sr-only">Quitar archivo</span>
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              onFile(e.dataTransfer.files?.[0]);
            }}
            className="flex flex-col items-center gap-1 rounded-lg border border-dashed border-input px-4 py-6 text-sm text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft/40"
          >
            <FileUp className="size-6 text-primary" aria-hidden />
            <span className="font-medium text-foreground">Toca para subir el comprobante</span>
            <span className="text-xs">JPG, PNG o PDF</span>
          </button>
        )}
        {errors.proof && (
          <p className="text-[13px] text-destructive" role="alert">
            {errors.proof}
          </p>
        )}
      </div>

      <Field id="amount" label="Monto pagado (Bs)" error={errors.amount} required>
        <Input name="amount" inputMode="decimal" defaultValue={formatNumberBo(suggestedAmount)} autoComplete="off" />
      </Field>
      <Field id="reference" label="Nro. de transacción o referencia" error={errors.reference} hint="Opcional">
        <Input name="reference" maxLength={120} autoComplete="off" />
      </Field>
      <Field id="note" label="Nota" error={errors.note} hint="Opcional">
        <Textarea name="note" rows={2} maxLength={500} />
      </Field>

      {formError && (
        <p role="alert" className="rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground">
          {formError}
        </p>
      )}
      <Button type="submit" size="lg" className="h-12 w-full text-base" loading={pending}>
        Enviar comprobante
      </Button>
    </form>
  );
}
