// Shared (client + server) CSV import logic: column detection and row validation.
import { MAX_AMOUNT } from "@/lib/validation/common";
import { parseAmount, roundMoney, todayBo } from "@/lib/format";
import { isValidPhone } from "@/lib/phone";

export const IMPORT_FIELDS = [
  { key: "customer", label: "Cliente", required: true, aliases: ["cliente", "customer", "razon social", "nombre", "nombre cliente", "empresa", "client"] },
  { key: "phone", label: "Teléfono", required: true, aliases: ["telefono", "celular", "whatsapp", "phone", "movil", "cel", "tel", "nro celular"] },
  { key: "nit", label: "NIT", required: false, aliases: ["nit", "ci", "ci nit", "nit ci", "documento", "tax id"] },
  { key: "invoice_number", label: "Factura", required: true, aliases: ["factura", "nro factura", "numero factura", "n factura", "invoice", "invoice number", "nro", "numero", "documento venta", "comprobante"] },
  { key: "issue_date", label: "Fecha emisión", required: false, aliases: ["fecha emision", "emision", "fecha", "fecha factura", "issue date", "fecha de emision"] },
  { key: "due_date", label: "Fecha vencimiento", required: true, aliases: ["fecha vencimiento", "vencimiento", "vence", "due date", "fecha de vencimiento", "fecha limite"] },
  { key: "amount", label: "Monto", required: true, aliases: ["monto", "importe", "total", "saldo", "amount", "monto bs", "importe bs", "total bs", "saldo pendiente"] },
  { key: "description", label: "Descripción", required: false, aliases: ["descripcion", "detalle", "concepto", "description", "glosa"] },
] as const;

export type ImportFieldKey = (typeof IMPORT_FIELDS)[number]["key"];
export type ColumnMapping = Partial<Record<ImportFieldKey, string>>;
export type MappedRow = Partial<Record<ImportFieldKey, string>> & { row: number };

export type ValidRow = {
  row: number;
  customer: string;
  phone: string;
  nit: string | null;
  invoice_number: string;
  issue_date: string;
  due_date: string;
  amount: number;
  description: string | null;
};

export type RowResult = { ok: true; value: ValidRow } | { ok: false; row: number; errors: string[] };

export function normalizeHeader(h: string): string {
  return h
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

/** Auto-detects which CSV column feeds each field (exact alias first, then partial). */
export function detectMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<string>();
  const normalized = headers.map((h) => ({ raw: h, norm: normalizeHeader(h) }));
  for (const pass of ["exact", "partial"] as const) {
    for (const field of IMPORT_FIELDS) {
      if (mapping[field.key]) continue;
      const match = normalized.find(
        (h) =>
          !used.has(h.raw) &&
          field.aliases.some((a) => (pass === "exact" ? h.norm === a : h.norm.startsWith(a + " ") || h.norm.endsWith(" " + a))),
      );
      if (match) {
        mapping[field.key] = match.raw;
        used.add(match.raw);
      }
    }
  }
  return mapping;
}

/**
 * Parses dates as exported by Excel in Bolivia: 15/08/2026, 15-08-26, 2026-08-15,
 * 15.08.2026 and Excel serial numbers (45884). Day-first, never month-first.
 */
export function parseDate(input: string | undefined): string | null {
  const s = (input ?? "").trim();
  if (!s) return null;
  let y: number, m: number, d: number;
  let match = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (match) {
    [y, m, d] = [Number(match[1]), Number(match[2]), Number(match[3])];
  } else if ((match = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/))) {
    [d, m, y] = [Number(match[1]), Number(match[2]), Number(match[3])];
    if (y < 100) y += 2000;
  } else if (/^\d{5}$/.test(s)) {
    const date = new Date(Date.UTC(1899, 11, 30) + Number(s) * 86_400_000);
    return date.toISOString().slice(0, 10);
  } else {
    return null;
  }
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) return null;
  if (y < 2000 || y > 2100) return null;
  return date.toISOString().slice(0, 10);
}

export function applyMapping(records: Record<string, string>[], mapping: ColumnMapping, firstRowNumber = 2): MappedRow[] {
  return records.map((rec, i) => {
    const row: MappedRow = { row: i + firstRowNumber };
    for (const field of IMPORT_FIELDS) {
      const col = mapping[field.key];
      if (col) row[field.key] = (rec[col] ?? "").toString().trim();
    }
    return row;
  });
}

export function validateRow(r: MappedRow, today: string = todayBo()): RowResult {
  const errors: string[] = [];
  const customer = (r.customer ?? "").trim();
  if (customer.length < 2) errors.push("Falta el cliente");
  else if (customer.length > 160) errors.push("Cliente demasiado largo");

  const phone = (r.phone ?? "").trim();
  if (!phone) errors.push("Falta el teléfono");
  else if (!isValidPhone(phone)) errors.push(`Teléfono no válido (${phone})`);

  const nit = (r.nit ?? "").trim();
  if (nit && !/^[0-9-]{4,20}$/.test(nit)) errors.push("NIT no válido");

  const invoiceNumber = (r.invoice_number ?? "").trim();
  if (!invoiceNumber) errors.push("Falta el número de factura");
  else if (invoiceNumber.length > 60) errors.push("Número de factura demasiado largo");

  const due = parseDate(r.due_date);
  if (!r.due_date?.trim()) errors.push("Falta la fecha de vencimiento");
  else if (!due) errors.push(`Fecha de vencimiento no válida (${r.due_date}); usa DD/MM/AAAA`);

  let issue = parseDate(r.issue_date);
  if (r.issue_date?.trim() && !issue) errors.push(`Fecha de emisión no válida (${r.issue_date}); usa DD/MM/AAAA`);
  if (!r.issue_date?.trim() && due) issue = due < today ? due : today;
  if (issue && due && due < issue) errors.push("El vencimiento es anterior a la emisión");

  const amount = parseAmount(r.amount ?? "");
  if (!r.amount?.trim()) errors.push("Falta el monto");
  else if (!Number.isFinite(amount) || amount <= 0) errors.push(`Monto no válido (${r.amount})`);
  else if (amount > MAX_AMOUNT) errors.push("Monto demasiado alto");

  const description = (r.description ?? "").trim().slice(0, 300) || null;

  if (errors.length) return { ok: false, row: r.row, errors };
  return {
    ok: true,
    value: {
      row: r.row,
      customer,
      phone,
      nit: nit || null,
      invoice_number: invoiceNumber,
      issue_date: issue as string,
      due_date: due as string,
      amount: roundMoney(amount),
      description,
    },
  };
}

/** Validates all rows and flags invoice numbers repeated inside the same file. */
export function validateRows(rows: MappedRow[], today?: string): RowResult[] {
  const seen = new Map<string, number>();
  return rows.map((r) => {
    const result = validateRow(r, today);
    if (!result.ok) return result;
    const key = result.value.invoice_number.toLowerCase();
    const first = seen.get(key);
    if (first !== undefined) return { ok: false, row: r.row, errors: [`Factura repetida en el archivo (fila ${first})`] };
    seen.set(key, r.row);
    return result;
  });
}

export function normalizeName(name: string): string {
  return normalizeHeader(name);
}
