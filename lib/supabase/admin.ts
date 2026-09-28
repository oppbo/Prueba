import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";
import { publicEnv } from "@/lib/env";

/**
 * Service-role client. Bypasses RLS — use ONLY for the public payment page
 * (token-validated RPCs + proof upload) and never import from client code.
 * The `server-only` import makes the build fail if that ever happens.
 */
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!publicEnv.supabaseUrl || !key) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  }
  return createClient<Database>(publicEnv.supabaseUrl, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function isAdminConfigured(): boolean {
  return Boolean(publicEnv.supabaseUrl && process.env.SUPABASE_SERVICE_ROLE_KEY);
}
