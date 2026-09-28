"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { AlertCircle, ExternalLink, MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Field } from "@/components/ui/field";
import { NativeSelect, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { CopyButton } from "@/components/shared/copy-button";
import { logWhatsAppOpened, preparePaymentLink } from "@/lib/actions/collections";
import { daysBetween, formatBs, formatDate, todayBo } from "@/lib/format";
import { formatPhone, normalizePhone } from "@/lib/phone";
import {
  REMINDER_TEMPLATE_IDS,
  REMINDER_TEMPLATE_LABELS,
  buildWhatsAppUrl,
  renderTemplate,
  suggestTemplate,
  type ReminderTemplateId,
} from "@/lib/whatsapp";
import { useReminderConfig } from "./reminder-context";
import type { CollectibleInvoice } from "./types";

export function ReminderDialog({
  invoices,
  triggerLabel = "WhatsApp",
  triggerProps,
  iconOnly = false,
}: {
  invoices: CollectibleInvoice[];
  triggerLabel?: string;
  triggerProps?: ButtonProps;
  iconOnly?: boolean;
}) {
  const [open, setOpen] = useState(false);
  if (invoices.length === 0) return null;
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="whatsapp" size={iconOnly ? "icon-sm" : "sm"} title={iconOnly ? "Recordar por WhatsApp" : undefined} {...triggerProps}>
          <MessageCircle />
          {iconOnly ? <span className="sr-only">Recordar por WhatsApp</span> : triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent size="md">{open && <ReminderForm invoices={invoices} onDone={() => setOpen(false)} />}</DialogContent>
    </Dialog>
  );
}

function ReminderForm({ invoices, onDone }: { invoices: CollectibleInvoice[]; onDone: () => void }) {
  const { organizationName, templates } = useReminderConfig();
  const [invoiceId, setInvoiceId] = useState(invoices[0].id);
  const invoice = invoices.find((i) => i.id === invoiceId) ?? invoices[0];
  const today = todayBo();
  const daysUntilDue = daysBetween(today, invoice.due_date);
  const [templateId, setTemplateId] = useState<ReminderTemplateId>(suggestTemplate(daysUntilDue));
  const [links, setLinks] = useState<Record<string, string>>({});
  const [linkError, setLinkError] = useState<string | null>(null);
  // Edits are kept per rendered template: switching template/invoice re-fills the text.
  const [edited, setEdited] = useState<{ base: string; text: string } | null>(null);
  const [opening, setOpening] = useState(false);
  const paymentUrl = links[invoice.id];

  useEffect(() => {
    if (links[invoice.id]) return;
    let cancelled = false;
    preparePaymentLink(invoice.id).then((result) => {
      if (cancelled) return;
      if (result.ok) setLinks((prev) => ({ ...prev, [invoice.id]: result.data.url }));
      else setLinkError(result.error);
    });
    return () => {
      cancelled = true;
    };
  }, [invoice.id, links]);

  const rendered = useMemo(
    () =>
      paymentUrl
        ? renderTemplate(templates[templateId], {
            customerName: invoice.customer_name,
            organizationName,
            invoiceNumber: invoice.invoice_number,
            amount: invoice.outstanding_amount,
            dueDate: invoice.due_date,
            daysOverdue: -daysUntilDue,
            paymentLink: paymentUrl,
          })
        : "",
    [paymentUrl, templates, templateId, invoice, organizationName, daysUntilDue],
  );

  const message = edited && edited.base === rendered ? edited.text : rendered;

  const phoneOk = normalizePhone(invoice.customer_phone) !== null;

  function openWhatsApp() {
    const url = buildWhatsAppUrl(invoice.customer_phone, message);
    if (!url) return;
    setOpening(true);
    // Log first (fire-and-forget), then open synchronously in the click handler so
    // popup blockers allow the new tab.
    const logging = logWhatsAppOpened({ invoice_id: invoice.id, message });
    window.open(url, "_blank", "noopener,noreferrer");
    logging
      .then((r) => {
        if (r.ok) toast.success("WhatsApp abierto. Envía el mensaje desde WhatsApp para completar el recordatorio.");
        else toast.error(r.error);
      })
      .finally(() => {
        setOpening(false);
        onDone();
      });
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>Recordatorio por WhatsApp</DialogTitle>
        <DialogDescription>
          {invoice.customer_name} · {formatPhone(invoice.customer_phone)}
        </DialogDescription>
      </DialogHeader>
      <DialogBody className="grid gap-4">
        {invoices.length > 1 && (
          <Field id="reminder-invoice" label="Factura">
            <NativeSelect value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}>
              {invoices.map((i) => (
                <option key={i.id} value={i.id}>
                  {i.invoice_number} · {formatBs(i.outstanding_amount)} · vence {formatDate(i.due_date)}
                </option>
              ))}
            </NativeSelect>
          </Field>
        )}
        <Field id="reminder-template" label="Plantilla">
          <NativeSelect value={templateId} onChange={(e) => setTemplateId(e.target.value as ReminderTemplateId)}>
            {REMINDER_TEMPLATE_IDS.map((id) => (
              <option key={id} value={id}>
                {REMINDER_TEMPLATE_LABELS[id].title}
              </option>
            ))}
          </NativeSelect>
        </Field>
        {linkError ? (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-destructive-soft p-3 text-sm text-destructive-soft-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden /> {linkError}
          </p>
        ) : !paymentUrl ? (
          <div className="grid gap-2" aria-label="Preparando mensaje">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-44 w-full" />
          </div>
        ) : (
          <Field id="reminder-message" label="Mensaje" hint="Puedes editar el texto antes de abrir WhatsApp.">
            <Textarea rows={9} value={message} onChange={(e) => setEdited({ base: rendered, text: e.target.value })} maxLength={2000} />
          </Field>
        )}
        {!phoneOk && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-warning-soft p-3 text-sm text-warning-soft-foreground">
            <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
            <span>
              El teléfono del cliente no es válido.{" "}
              <Link href={`/dashboard/customers/${invoice.customer_id}`} className="font-medium underline">
                Corrígelo en su ficha
              </Link>
              .
            </span>
          </p>
        )}
        <p className="text-xs text-muted-foreground">
          CobraYa abre WhatsApp con el mensaje listo; el envío lo confirmas tú desde WhatsApp.
        </p>
      </DialogBody>
      <DialogFooter>
        {paymentUrl && (
          <Button asChild variant="ghost" size="sm" className="sm:mr-auto">
            <a href={paymentUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink /> Ver página de pago
            </a>
          </Button>
        )}
        <CopyButton value={message} label="Copiar mensaje" successMessage="Mensaje copiado" disabled={!message} />
        <Button variant="whatsapp" size="sm" onClick={openWhatsApp} disabled={!message.trim() || !phoneOk} loading={opening}>
          {!opening && <MessageCircle />}
          Abrir en WhatsApp
        </Button>
      </DialogFooter>
    </>
  );
}
