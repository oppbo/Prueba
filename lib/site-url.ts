import "server-only";
import { headers } from "next/headers";

/** Absolute base URL of the app, used for payment links and auth redirects. */
export async function getSiteUrl(): Promise<string> {
  const configured = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (configured) return configured.replace(/\/$/, "");
  if (process.env.VERCEL_ENV === "production" && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

/** Only allow same-site dashboard redirects after login (prevents open redirects). */
export function safeNextPath(next: unknown): string {
  if (typeof next !== "string") return "/dashboard";
  if (!next.startsWith("/dashboard") || next.startsWith("//") || next.includes("\\")) return "/dashboard";
  return next;
}
