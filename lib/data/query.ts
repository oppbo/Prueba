/** Removes characters with meaning in PostgREST filter syntax from user search input. */
export function sanitizeSearch(q: unknown): string {
  if (typeof q !== "string") return "";
  return q.replace(/[,%()*\\:"'.]/g, " ").replace(/\s+/g, " ").trim().slice(0, 80);
}

export function pageParam(value: unknown): number {
  const n = Number(typeof value === "string" ? value : 1);
  return Number.isInteger(n) && n > 0 && n < 10_000 ? n : 1;
}

export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : fallback;
}

/** Builds a query string from a base and overrides, dropping empty values. */
export function withParams(path: string, base: Record<string, string | undefined>, overrides: Record<string, string | number | undefined> = {}) {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...base, ...overrides })) {
    if (v !== undefined && v !== "" && v !== null) params.set(k, String(v));
  }
  const s = params.toString();
  return s ? `${path}?${s}` : path;
}
