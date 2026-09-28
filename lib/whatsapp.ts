import { formatDateNumeric, formatNumberBo } from "./format";
import { normalizePhone } from "./phone";

export type ReminderTemplateId = "before_due" | "due_today" | "overdue" | "strongly_overdue";

export const REMINDER_TEMPLATE_IDS: ReminderTemplateId[] = ["before_due", "due_today", "overdue", "strongly_overdue"];

export const REMINDER_TEMPLATE_LABELS: Record<ReminderTemplateId, { title: string; hint: string }> = {
  before_due: { title: "Antes del vencimiento", hint: "Recordatorio amable días antes de la fecha." },
  due_today: { title: "Vence hoy", hint: "Para el mismo día del vencimiento." },
  overdue: { title: "Vencida", hint: "Para facturas con pocos días de atraso." },
  strongly_overdue: { title: "Muy vencida", hint: "Más de 30 días de atraso, firme pero cordial." },
};

export const DEFAULT_REMINDER_TEMPLATES: Record<ReminderTemplateId, string> = {
  before_due: `Hola {{customerName}}, te saludamos de {{organizationName}}.

Te recordamos que la factura {{invoiceNumber}} por Bs {{amount}} vence el {{dueDate}}.

Puedes revisar los datos de pago aquí:
{{paymentLink}}

¡Muchas gracias por tu preferencia!`,
  due_today: `Hola {{customerName}}, te escribimos de {{organizationName}}.

Te recordamos que hoy vence la factura {{invoiceNumber}} por Bs {{amount}}.

Puedes pagar escaneando nuestro QR aquí:
{{paymentLink}}

Si ya realizaste el pago, por favor envíanos el comprobante en el mismo enlace. Muchas gracias.`,
  overdue: `Hola {{customerName}}, te escribimos de {{organizationName}}.

Te recordamos que la factura {{invoiceNumber}} por Bs {{amount}} se encuentra pendiente.

Fecha de vencimiento: {{dueDate}}.

Puedes revisar los datos de pago aquí:
{{paymentLink}}

Muchas gracias.`,
  strongly_overdue: `Estimado/a {{customerName}}, le saludamos de {{organizationName}}.

La factura {{invoiceNumber}} por Bs {{amount}} registra {{daysOverdue}} días de atraso (vencimiento: {{dueDate}}).

Le agradeceríamos regularizar el pago a la brevedad o comunicarnos una fecha de pago. Puede pagar aquí:
{{paymentLink}}

Quedamos atentos. Muchas gracias.`,
};

export const TEMPLATE_VARIABLES = [
  { key: "customerName", label: "Nombre del cliente" },
  { key: "organizationName", label: "Tu empresa" },
  { key: "invoiceNumber", label: "Nro. de factura" },
  { key: "amount", label: "Monto pendiente" },
  { key: "dueDate", label: "Fecha de vencimiento" },
  { key: "daysOverdue", label: "Días de atraso" },
  { key: "paymentLink", label: "Link de pago" },
] as const;

export type TemplateVariables = {
  customerName: string;
  organizationName: string;
  invoiceNumber: string;
  amount: number;
  dueDate: string;
  daysOverdue: number;
  paymentLink: string;
};

/** Merges organization overrides (jsonb) on top of the defaults. */
export function resolveTemplates(overrides: unknown): Record<ReminderTemplateId, string> {
  const result = { ...DEFAULT_REMINDER_TEMPLATES };
  if (overrides && typeof overrides === "object") {
    for (const id of REMINDER_TEMPLATE_IDS) {
      const value = (overrides as Record<string, unknown>)[id];
      if (typeof value === "string" && value.trim()) result[id] = value;
    }
  }
  return result;
}

/** Picks the template that fits how late (or early) the invoice is. */
export function suggestTemplate(daysUntilDue: number): ReminderTemplateId {
  if (daysUntilDue > 0) return "before_due";
  if (daysUntilDue === 0) return "due_today";
  if (daysUntilDue >= -30) return "overdue";
  return "strongly_overdue";
}

export function renderTemplate(template: string, vars: TemplateVariables): string {
  const values: Record<string, string> = {
    customerName: vars.customerName,
    organizationName: vars.organizationName,
    invoiceNumber: vars.invoiceNumber,
    amount: formatNumberBo(vars.amount),
    dueDate: formatDateNumeric(vars.dueDate),
    daysOverdue: String(Math.max(vars.daysOverdue, 0)),
    paymentLink: vars.paymentLink,
  };
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => values[key] ?? match);
}

/** Click-to-chat URL. Returns null if the phone cannot be normalized. */
export function buildWhatsAppUrl(phone: string, message: string): string | null {
  const normalized = normalizePhone(phone);
  if (!normalized) return null;
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
