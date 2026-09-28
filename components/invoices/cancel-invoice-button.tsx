"use client";

import { useState, useTransition } from "react";
import { Ban } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { cancelInvoice } from "@/lib/actions/invoices";

export function CancelInvoiceButton({ invoiceId, invoiceNumber }: { invoiceId: string; invoiceNumber: string }) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" className="text-destructive hover:bg-destructive-soft hover:text-destructive">
          <Ban /> Anular
        </Button>
      </DialogTrigger>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>¿Anular la factura {invoiceNumber}?</DialogTitle>
          <DialogDescription>Dejará de contar en tus cuentas por cobrar y su link de pago se desactivará.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <p className="text-sm text-muted-foreground">Esta acción no se puede deshacer desde la aplicación.</p>
        </DialogBody>
        <DialogFooter>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Volver
          </Button>
          <Button
            variant="destructive"
            loading={pending}
            onClick={() =>
              startTransition(async () => {
                const result = await cancelInvoice(invoiceId);
                if (!result.ok) toast.error(result.error);
                else {
                  toast.success("Factura anulada");
                  setOpen(false);
                }
              })
            }
          >
            Anular factura
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
