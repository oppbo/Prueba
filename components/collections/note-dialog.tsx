"use client";

import { useState, useTransition } from "react";
import { StickyNote } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { addNote } from "@/lib/actions/collections";

export function NoteDialog({
  customerId,
  invoiceId,
  subtitle,
  triggerLabel = "Agregar nota",
  triggerProps,
}: {
  customerId: string;
  invoiceId?: string | null;
  subtitle?: string;
  triggerLabel?: string;
  triggerProps?: ButtonProps;
}) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (message.trim().length < 2) {
      setError("Escribe la nota");
      return;
    }
    startTransition(async () => {
      const result = await addNote({ customer_id: customerId, invoice_id: invoiceId ?? null, message });
      if (!result.ok) {
        setError(result.fieldErrors?.message ?? result.error);
        return;
      }
      toast.success("Nota guardada");
      setMessage("");
      setError(null);
      setOpen(false);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" {...triggerProps}>
          <StickyNote />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <form onSubmit={submit} noValidate>
          <DialogHeader>
            <DialogTitle>Agregar nota de cobranza</DialogTitle>
            {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
          </DialogHeader>
          <DialogBody>
            <Field id="note-message" label="Nota" error={error ?? undefined} hint="Ej.: Llamé al encargado, promete pagar el viernes.">
              <Textarea rows={4} value={message} onChange={(e) => setMessage(e.target.value)} maxLength={1000} autoFocus />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" loading={pending}>
              Guardar nota
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
