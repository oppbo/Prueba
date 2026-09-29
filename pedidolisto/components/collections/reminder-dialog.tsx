"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Copy, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/input";
import { formatMoney, formatPhone, formatTime, whatsappLink } from "@/lib/format";
import { useAccounts, useData } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import type { ID } from "@/lib/types";
import { firstName } from "@/lib/utils";

export function ReminderDialog() {
  const reminderFor = useUiStore((s) => s.reminderFor);
  const close = useUiStore((s) => s.closeReminder);
  return (
    <Dialog open={!!reminderFor} onOpenChange={(v) => !v && close()}>
      <DialogContent size="md">{reminderFor && <ReminderBody key={reminderFor} customerId={reminderFor} onDone={close} />}</DialogContent>
    </Dialog>
  );
}

function ReminderBody({ customerId, onDone }: { customerId: ID; onDone: () => void }) {
  const data = useData();
  const accounts = useAccounts();
  const customer = data.customers.find((c) => c.id === customerId);
  const account = accounts.get(customerId);
  const amount = account ? (account.overdueDebt > 0 ? account.overdueDebt : account.currentDebt) : 0;
  const [message, setMessage] = useState(
    customer
      ? `Hola ${firstName(customer.ownerName)}, te recordamos que tienes un saldo pendiente de ${formatMoney(amount)} con ${data.company.name}. Muchas gracias.`
      : "",
  );
  if (!customer) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      toast.success("Mensaje copiado", { description: "Pégalo en el chat de WhatsApp del cliente." });
    } catch {
      toast.error("No se pudo copiar. Selecciona el texto y cópialo manualmente.");
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Recordar pago</DialogTitle>
        <DialogDescription>
          {customer.businessName} · {formatPhone(customer.phone)}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="space-y-4">
        <div className="rounded-xl bg-[#efeae2] p-4">
          <div className="ml-auto max-w-[88%] rounded-lg rounded-tr-none bg-[#d9fdd3] px-3 py-2 text-sm leading-relaxed text-zinc-900 shadow-sm">
            <p className="whitespace-pre-wrap">{message || " "}</p>
            <p className="mt-1 text-right text-[10px] text-zinc-500">{formatTime(new Date())}</p>
          </div>
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="reminder-text" className="text-sm font-medium">
            Mensaje
          </label>
          <Textarea id="reminder-text" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
          <p className="text-xs text-muted-foreground">
            No se envía automáticamente: copia el mensaje o ábrelo en WhatsApp para enviarlo tú.
          </p>
        </div>
      </DialogBody>
      <DialogFooter>
        <Button asChild variant="secondary">
          <a href={whatsappLink(customer.phone, message)} target="_blank" rel="noopener noreferrer" onClick={() => setTimeout(onDone, 300)}>
            <MessageCircle className="text-[#128c4a]" /> Abrir WhatsApp
          </a>
        </Button>
        <Button type="button" onClick={copy} disabled={!message.trim()}>
          <Copy /> Copiar mensaje
        </Button>
      </DialogFooter>
    </>
  );
}
