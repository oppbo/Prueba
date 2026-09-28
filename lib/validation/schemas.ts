import { z } from "zod";
import {
  emailOptional,
  isoDate,
  moneyString,
  nitString,
  optionalText,
  phoneString,
  uuid,
} from "./common";
import { REMINDER_TEMPLATE_IDS } from "@/lib/whatsapp";

// ---------------------------------------------------------------- auth
export const loginSchema = z.object({
  email: z.string().trim().pipe(z.email({ message: "Ingresa un correo válido" })),
  password: z.string().min(1, "Ingresa tu contraseña"),
});

export const signupSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresa tu nombre").max(80),
  organizationName: z.string().trim().min(2, "Ingresa el nombre de tu empresa").max(120),
  email: z.string().trim().pipe(z.email({ message: "Ingresa un correo válido" })),
  password: z.string().min(8, "Mínimo 8 caracteres").max(72, "Máximo 72 caracteres"),
});

// ---------------------------------------------------------------- customers
export const customerSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre del cliente").max(160),
  business_name: optionalText(160),
  nit: nitString,
  phone: phoneString,
  email: emailOptional,
  address: optionalText(240),
  city: optionalText(80),
  notes: optionalText(1000),
  status: z.enum(["active", "inactive"]).default("active"),
});
export type CustomerFormInput = z.input<typeof customerSchema>;

// ---------------------------------------------------------------- invoices
export const invoiceSchema = z
  .object({
    customer_id: uuid.or(z.literal("")).refine((v) => v !== "", "Selecciona un cliente"),
    invoice_number: z.string().trim().min(1, "Ingresa el número de factura").max(60),
    description: optionalText(300),
    issue_date: isoDate,
    due_date: isoDate,
    amount: moneyString,
    notes: optionalText(1000),
  })
  .refine((v) => v.due_date >= v.issue_date, {
    path: ["due_date"],
    message: "El vencimiento no puede ser antes de la emisión",
  });
export type InvoiceFormInput = z.input<typeof invoiceSchema>;

// ---------------------------------------------------------------- payments
export const PAYMENT_METHODS = ["bank_transfer", "qr", "cash", "other"] as const;

export const recordPaymentSchema = z.object({
  invoice_id: uuid,
  amount: moneyString,
  payment_date: isoDate,
  payment_method: z.enum(PAYMENT_METHODS),
  reference: optionalText(120),
  notes: optionalText(500),
});
export type RecordPaymentInput = z.input<typeof recordPaymentSchema>;

export const rejectPaymentSchema = z.object({
  payment_id: uuid,
  reason: optionalText(300),
});

export const publicProofSchema = z.object({
  amount: moneyString,
  reference: optionalText(120),
  note: optionalText(500),
});

// ---------------------------------------------------------------- collections
export const noteSchema = z.object({
  customer_id: uuid,
  invoice_id: uuid.nullable().optional(),
  message: z.string().trim().min(2, "Escribe la nota").max(1000, "Máximo 1000 caracteres"),
});
export type NoteInput = z.input<typeof noteSchema>;

export const whatsappLogSchema = z.object({
  invoice_id: uuid,
  message: z.string().trim().min(1).max(2000),
});

// ---------------------------------------------------------------- settings
export const organizationSchema = z.object({
  name: z.string().trim().min(2, "Ingresa el nombre comercial").max(120),
  legal_name: optionalText(160),
  nit: nitString,
  phone: z
    .string()
    .trim()
    .max(25)
    .optional()
    .refine((v) => !v || phoneString.safeParse(v).success, "Teléfono no válido")
    .transform((v) => (v ? v : null)),
  address: optionalText(240),
  city: optionalText(80),
});
export type OrganizationInput = z.input<typeof organizationSchema>;

export const bankSchema = z.object({
  bank_name: optionalText(80),
  bank_account_name: optionalText(160),
  bank_account_number: optionalText(40),
});
export type BankInput = z.input<typeof bankSchema>;

export const templatesSchema = z.object(
  Object.fromEntries(
    REMINDER_TEMPLATE_IDS.map((id) => [id, z.string().trim().min(10, "La plantilla es muy corta").max(1500, "Máximo 1500 caracteres")]),
  ) as Record<(typeof REMINDER_TEMPLATE_IDS)[number], z.ZodString>,
);
export type TemplatesInput = z.input<typeof templatesSchema>;
