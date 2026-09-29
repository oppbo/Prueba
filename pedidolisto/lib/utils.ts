import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function initials(name: string | null | undefined): string {
  if (!name) return "?";
  const parts = name
    .replace(/^(Tienda|Abarrotes|Minimarket|Micromercado|Comercial|Supermercado|Mercado|Despensa|Kiosco)\s+/i, "")
    .trim()
    .split(/\s+/)
    .filter((p) => p.length > 1 || /[A-Z]/.test(p));
  if (parts.length === 0) return name.slice(0, 2).toUpperCase();
  const letters = parts.length === 1 ? parts[0].slice(0, 2) : parts[0][0] + parts[1][0];
  return letters.toUpperCase();
}

export function firstName(fullName: string | null | undefined): string {
  return fullName?.trim().split(/\s+/)[0] ?? "";
}

export function sum<T>(items: readonly T[], pick: (item: T) => number): number {
  let total = 0;
  for (const item of items) total += pick(item);
  return total;
}

export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}
