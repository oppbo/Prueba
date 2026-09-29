/**
 * Formatting helpers for Bolivia: bolivianos with "." thousands and "," decimals,
 * dates like "28 sep 2026" and 24h times like "15:42".
 */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];
const WEEKDAYS_SHORT = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const WEEKDAYS_LONG = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"];

const DAY_MS = 86_400_000;

function groupThousands(integer: string): string {
  return integer.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** 2340 → "2.340"; 2340.5 → "2.340,50" (decimals only when needed, unless forced). */
export function formatNumber(value: number, options: { decimals?: 0 | 2 | "auto" } = {}): string {
  const { decimals = "auto" } = options;
  const negative = value < 0;
  const abs = Math.abs(value);
  const hasCents = Math.round(abs * 100) % 100 !== 0;
  const useDecimals = decimals === 2 || (decimals === "auto" && hasCents);
  const fixed = useDecimals ? abs.toFixed(2) : Math.round(abs).toString();
  const [int, dec] = fixed.split(".");
  const out = dec ? `${groupThousands(int)},${dec}` : groupThousands(int);
  return negative ? `-${out}` : out;
}

/** Money in bolivianos: "Bs 2.340" or "Bs 12,50". */
export function formatMoney(value: number, options: { decimals?: 0 | 2 | "auto" } = {}): string {
  const text = formatNumber(value, options);
  return text.startsWith("-") ? `-Bs ${text.slice(1)}` : `Bs ${text}`;
}

/** Compact money for chart axes: "Bs 38k". */
export function formatMoneyCompact(value: number): string {
  if (Math.abs(value) >= 1_000_000) return `Bs ${formatNumber(Math.round(value / 100_000) / 10)}M`;
  if (Math.abs(value) >= 1_000) return `Bs ${Math.round(value / 1_000)}k`;
  return `Bs ${Math.round(value)}`;
}

export function formatPercent(value: number, options: { signed?: boolean } = {}): string {
  const text = Math.abs(value).toFixed(1).replace(".", ",");
  if (!options.signed) return `${text}%`;
  return `${value >= 0 ? "+" : "−"}${text}%`;
}

function toDate(value: string | Date): Date {
  return typeof value === "string" ? new Date(value) : value;
}

/** "28 sep 2026" */
export function formatDate(value: string | Date): string {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "28 sep" */
export function formatShortDate(value: string | Date): string {
  const d = toDate(value);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/** "18 de septiembre" */
export function formatLongDate(value: string | Date): string {
  const d = toDate(value);
  return `${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

/** "martes, 29 de septiembre" */
export function formatFullDate(value: string | Date): string {
  const d = toDate(value);
  return `${WEEKDAYS_LONG[d.getDay()]}, ${d.getDate()} de ${MONTHS_LONG[d.getMonth()]}`;
}

/** "15:42" */
export function formatTime(value: string | Date): string {
  const d = toDate(value);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export function formatWeekday(value: string | Date): string {
  return WEEKDAYS_SHORT[toDate(value).getDay()];
}

export function startOfDay(value: string | Date = new Date()): Date {
  const d = new Date(toDate(value));
  d.setHours(0, 0, 0, 0);
  return d;
}

export function isSameDay(a: string | Date, b: string | Date): boolean {
  return startOfDay(a).getTime() === startOfDay(b).getTime();
}

export function isToday(value: string | Date): boolean {
  return isSameDay(value, new Date());
}

/** Whole calendar days between two dates (b - a). */
export function daysBetween(a: string | Date, b: string | Date): number {
  return Math.round((startOfDay(b).getTime() - startOfDay(a).getTime()) / DAY_MS);
}

export function addDays(value: string | Date, days: number): Date {
  const d = new Date(toDate(value));
  d.setDate(d.getDate() + days);
  return d;
}

/** "Hoy, 15:42" · "Ayer, 09:10" · "26 sep, 11:05" */
export function formatDateTime(value: string | Date): string {
  const d = toDate(value);
  const diff = daysBetween(d, new Date());
  if (diff === 0) return `Hoy, ${formatTime(d)}`;
  if (diff === 1) return `Ayer, ${formatTime(d)}`;
  const sameYear = d.getFullYear() === new Date().getFullYear();
  return `${sameYear ? formatShortDate(d) : formatDate(d)}, ${formatTime(d)}`;
}

/** "Hoy" · "Ayer" · "Hace 8 días" · "28 sep 2026" */
export function formatRelativeDay(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const diff = daysBetween(value, new Date());
  if (diff === 0) return "Hoy";
  if (diff === 1) return "Ayer";
  if (diff > 1 && diff <= 30) return `Hace ${diff} días`;
  if (diff === -1) return "Mañana";
  if (diff < -1 && diff >= -14) return `En ${-diff} días`;
  return formatDate(value);
}

/** "hace 5 min" · "hace 2 h" · "ayer" */
export function formatTimeAgo(value: string | Date): string {
  const minutes = Math.round((Date.now() - toDate(value).getTime()) / 60_000);
  if (minutes < 1) return "ahora";
  if (minutes < 60) return `hace ${minutes} min`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = daysBetween(value, new Date());
  if (days === 1) return "ayer";
  return `hace ${days} días`;
}

/** Bolivian mobile numbers: "71234567" → "712 34567". */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^591/, "");
  if (digits.length === 8) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
  return phone;
}

export function whatsappLink(phone: string, text: string): string {
  const digits = phone.replace(/\D/g, "").replace(/^591/, "");
  return `https://wa.me/591${digits}?text=${encodeURIComponent(text)}`;
}

export function greeting(date: Date = new Date()): string {
  const h = date.getHours();
  if (h < 12) return "Buenos días";
  if (h < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function pluralize(count: number, singular: string, plural = `${singular}s`): string {
  return `${formatNumber(count)} ${count === 1 ? singular : plural}`;
}
