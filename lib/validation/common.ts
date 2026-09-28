import { z } from "zod";
import { parseAmount } from "@/lib/format";
import { isValidPhone } from "@/lib/phone";

export const MAX_AMOUNT = 100_000_000;

export const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max, `Máximo ${max} caracteres`)
    .optional()
    .transform((v) => (v ? v : null));

export const isoDate = z
  .string({ message: "Ingresa una fecha" })
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Ingresa una fecha válida")
  .refine((v) => !Number.isNaN(Date.parse(v)), "Ingresa una fecha válida");

export const moneyString = z
  .string({ message: "Ingresa un monto" })
  .trim()
  .min(1, "Ingresa un monto")
  .transform((v, ctx) => {
    const n = parseAmount(v);
    if (!Number.isFinite(n) || n <= 0) {
      ctx.addIssue({ code: "custom", message: "El monto debe ser mayor a 0" });
      return z.NEVER;
    }
    if (n > MAX_AMOUNT) {
      ctx.addIssue({ code: "custom", message: "El monto es demasiado alto" });
      return z.NEVER;
    }
    return Math.round(n * 100) / 100;
  });

export const phoneString = z
  .string({ message: "Ingresa un teléfono" })
  .trim()
  .min(1, "Ingresa un teléfono")
  .max(25, "Teléfono demasiado largo")
  .refine(isValidPhone, "Ingresa un celular válido, por ejemplo 71234567");

export const nitString = z
  .string()
  .trim()
  .max(20, "NIT demasiado largo")
  .refine((v) => v === "" || /^[0-9-]{4,20}$/.test(v), "El NIT solo debe tener números")
  .optional()
  .transform((v) => (v ? v : null));

export const emailOptional = z
  .string()
  .trim()
  .max(160)
  .refine((v) => v === "" || z.email().safeParse(v).success, "Correo no válido")
  .optional()
  .transform((v) => (v ? v.toLowerCase() : null));

export const uuid = z.uuid({ message: "Identificador no válido" });
