"use client";

import { useState, useTransition } from "react";
import { Check, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { rejectPayment, verifyPayment } from "@/lib/actions/payments";
import { formatBs } from "@/lib/format";

export function PaymentReviewActions({
  paymentId,
  amount,
  customerName,
  invoiceNumber,
  invoiceOutstanding,
}: {
  paymentId: string;
  amount: number;
  customerName: string;
  invoiceNumber: string | null;
  invoiceOutstanding: number | null;
}) {
  const [verifyOpen, setVerifyOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [pending, startTransition] = useTransition();
  const exceeds = invoiceOutstanding !== null && amount > invoiceOutstanding;

  return (
    <div className="flex gap-2">
      <Dialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <DialogTrigger asChild>
          <Button variant="secondary" size="sm">
            <X /> Rechazar
          </Button>
        </DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Rechazar comprobante</DialogTitle>
            <DialogDescription>
              {customerName} · {formatBs(amount)}. El saldo de la factura no cambia.
            </DialogDescription>
          </DialogHeader>
          <DialogBody>
            <Field id={`reason-${paymentId}`} label="Motivo" hint="Opcional. Queda en el historial del cliente.">
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} placeholder="Ej.: El monto no llegó a la cuenta." />
            </Field>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setRejectOpen(false)}>
              Volver
            </Button>
            <Button
              variant="destructive"
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await rejectPayment({ payment_id: paymentId, reason });
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success("Comprobante rechazado");
                    setRejectOpen(false);
                  }
                })
              }
            >
              Rechazar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <DialogTrigger asChild>
          <Button size="sm">
            <Check /> Verificar pago
          </Button>
        </DialogTrigger>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>¿Confirmas que recibiste {formatBs(amount)}?</DialogTitle>
            <DialogDescription>
              {customerName}
              {invoiceNumber ? ` · Factura ${invoiceNumber}` : ""}
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="grid gap-3 text-sm">
            <p className="text-muted-foreground">Revisa en tu banca que el dinero haya llegado. Al verificar, se descuenta del saldo de la factura.</p>
            {invoiceOutstanding !== null && (
              <p>
                Saldo actual: <strong className="tabular">{formatBs(invoiceOutstanding)}</strong> → queda{" "}
                <strong className="tabular">{formatBs(Math.max(invoiceOutstanding - amount, 0))}</strong>
              </p>
            )}
            {exceeds && (
              <p className="rounded-lg bg-warning-soft p-3 text-warning-soft-foreground">
                El monto reportado supera el saldo pendiente. La factura quedará pagada; revisa la diferencia con el cliente.
              </p>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setVerifyOpen(false)}>
              Volver
            </Button>
            <Button
              loading={pending}
              onClick={() =>
                startTransition(async () => {
                  const r = await verifyPayment(paymentId);
                  if (!r.ok) toast.error(r.error);
                  else {
                    toast.success(
                      r.data.outstanding === null
                        ? "Pago verificado"
                        : r.data.outstanding > 0
                          ? `Pago verificado. Saldo pendiente: ${formatBs(r.data.outstanding)}`
                          : "Pago verificado. La factura quedó pagada.",
                    );
                    setVerifyOpen(false);
                  }
                })
              }
            >
              Sí, verificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
