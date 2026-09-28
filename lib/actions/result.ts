import type { z } from "zod";

export type ActionResult<T = null> =
  | { ok: true; data: T; message?: string }
  | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function ok<T>(data: T, message?: string): ActionResult<T> {
  return { ok: true, data, message };
}

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function fromZod(error: z.ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".");
    if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
  }
  return fail("Revisa los campos marcados.", fieldErrors);
}

const DB_ERRORS: Record<string, string> = {
  invoice_not_found: "La factura no existe o no tienes acceso.",
  payment_not_found: "El pago no existe o no tienes acceso.",
  invoice_cancelled: "La factura está anulada.",
  invalid_amount: "El monto no es válido.",
  amount_exceeds_balance: "El monto supera el saldo pendiente de la factura.",
  invalid_payment_date: "La fecha de pago no es válida.",
  payment_already_processed: "Este pago ya fue procesado por otra persona. Actualiza la página.",
  link_not_found: "El enlace de pago no es válido o expiró.",
  invoice_not_payable: "Esta factura ya no admite pagos.",
  invalid_proof_path: "No se pudo guardar el comprobante.",
  too_many_submissions: "Recibimos varios comprobantes en poco tiempo. Intenta nuevamente en una hora.",
};

/** Maps Postgres / PostgREST errors to user-facing Spanish messages. */
export function dbErrorMessage(error: { message?: string; code?: string } | null | undefined, fallback = "Ocurrió un error inesperado. Intenta nuevamente."): string {
  if (!error) return fallback;
  if (error.message && DB_ERRORS[error.message]) return DB_ERRORS[error.message];
  if (error.code === "23505") return "Ya existe un registro con esos datos.";
  if (error.code === "23503") return "El registro está relacionado con otros datos y no se puede modificar así.";
  if (error.code === "42501") return "No tienes permiso para realizar esta acción.";
  return fallback;
}
