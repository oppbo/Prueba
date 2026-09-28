import { differenceInCalendarDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";

export const TIMEZONE = "America/La_Paz";
export const CURRENCY_PREFIX = "Bs";

/**
 * Bolivian number format: "." thousands separator, "," decimal separator.
 * Implemented manually so server and browser render identical strings
 * regardless of the ICU data available in each runtime.
 */
export function formatNumberBo(value: number, decimals = 2): string {
  const safe = Number.isFinite(value) ? value : 0;
  const negative = safe < 0;
  const fixed = Math.abs(safe).toFixed(decimals);
  const [intPart, decPart] = fixed.split(".");
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return `${negative ? "-" : ""}${grouped}${decPart ? `,${decPart}` : ""}`;
}

/** "Bs 24.580,00" */
export function formatBs(value: number | string | null | undefined, decimals = 2): string {
  const n = typeof value === "string" ? Number(value) : (value ?? 0);
  return `${CURRENCY_PREFIX} ${formatNumberBo(n, decimals)}`;
}

/** Compact version for chart axes: "Bs 24,6 mil". */
export function formatBsCompact(value: number): string {
  const abs = Math.abs(value);
  const trim = (n: number) => formatNumberBo(n, Number.isInteger(Math.round(n * 10) / 10) ? 0 : 1);
  if (abs >= 1_000_000) return `Bs ${trim(value / 1_000_000)} M`;
  if (abs >= 1_000) return `Bs ${trim(value / 1_000)}k`;
  return `Bs ${formatNumberBo(value, 0)}`;
}

/**
 * Parses amounts typed or exported by Bolivian users: "2.450,50", "2450.50",
 * "2,450.50", "Bs 2.450". Returns NaN when the input is not a number.
 */
export function parseAmount(input: string | number | null | undefined): number {
  if (typeof input === "number") return input;
  if (!input) return NaN;
  let s = String(input).replace(/[^\d.,-]/g, "");
  if (!s || !/\d/.test(s)) return NaN;
  const lastDot = s.lastIndexOf(".");
  const lastComma = s.lastIndexOf(",");
  if (lastDot !== -1 && lastComma !== -1) {
    // Both present: the right-most one is the decimal separator.
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandsSep = decimalSep === "." ? "," : ".";
    s = s.split(thousandsSep).join("").replace(decimalSep, ".");
  } else if (lastComma !== -1) {
    const decimals = s.length - lastComma - 1;
    const commas = s.split(",").length - 1;
    s = commas === 1 && decimals !== 3 ? s.replace(",", ".") : s.split(",").join("");
  } else if (lastDot !== -1) {
    const decimals = s.length - lastDot - 1;
    const dots = s.split(".").length - 1;
    // "2.450" in Bolivia means two thousand four hundred fifty.
    if (dots > 1 || decimals === 3) s = s.split(".").join("");
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : NaN;
}

export function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Today's date in Bolivia as "YYYY-MM-DD". */
export function todayBo(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Adds days to a "YYYY-MM-DD" date string (calendar arithmetic, TZ-safe). */
export function addDaysIso(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + days));
  return dt.toISOString().slice(0, 10);
}

export function startOfMonthIso(date: string): string {
  return `${date.slice(0, 7)}-01`;
}

/** Local-midnight Date for a "YYYY-MM-DD" string, safe for display formatting. */
function isoDateToLocal(date: string): Date {
  const [y, m, d] = date.slice(0, 10).split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** "28 sep 2026" */
export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  return format(isoDateToLocal(date), "d MMM yyyy", { locale: es }).replace(".", "");
}

/** "28/09/2026" — used in WhatsApp messages. */
export function formatDateNumeric(date: string | null | undefined): string {
  if (!date) return "";
  const [y, m, d] = date.slice(0, 10).split("-");
  return `${d}/${m}/${y}`;
}

/** Days from `from` to `to` (both "YYYY-MM-DD"). Positive when `to` is later. */
export function daysBetween(from: string, to: string): number {
  return differenceInCalendarDays(isoDateToLocal(to), isoDateToLocal(from));
}

/** "hace 3 días" */
export function formatRelative(timestamp: string | null | undefined): string {
  if (!timestamp) return "Sin contacto";
  return formatDistanceToNowStrict(parseISO(timestamp), { locale: es, addSuffix: true });
}

const MONTHS_SHORT = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

/** "28 sep, 14:05" in La Paz time. */
export function formatDateTime(timestamp: string | null | undefined): string {
  if (!timestamp) return "—";
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    day: "numeric",
    month: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(timestamp));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${MONTHS_SHORT[Number(get("month")) - 1]}, ${get("hour")}:${get("minute")}`;
}

export function monthLabel(isoMonth: string): string {
  const label = format(isoDateToLocal(`${isoMonth}-01`), "MMM", { locale: es }).replace(".", "");
  return label.charAt(0).toUpperCase() + label.slice(1);
}

/** Describes due status in plain Spanish for tables and cards. */
export function dueLabel(dueDate: string, today: string = todayBo()): string {
  const diff = daysBetween(today, dueDate);
  if (diff === 0) return "Vence hoy";
  if (diff === 1) return "Vence mañana";
  if (diff > 1) return `Vence en ${diff} días`;
  const late = -diff;
  return late === 1 ? "1 día vencida" : `${late} días vencida`;
}
