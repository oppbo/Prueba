import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { MemberRole, OrganizationRow } from "@/types/database";

export type SessionContext = {
  userId: string;
  email: string;
  fullName: string | null;
  role: MemberRole;
  organization: OrganizationRow;
  /** Throwaway sandbox created by "Probar demo". */
  isDemo: boolean;
};

/**
 * Resolves the signed-in user and their organization once per request.
 * Identity is verified against Supabase Auth (getUser), never trusted from cookies alone.
 */
export const getSession = cache(async (): Promise<SessionContext | null> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [{ data: membership }, { data: profile }] = await Promise.all([
    supabase
      .from("organization_members")
      .select("role, organization_id, organizations(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);

  const organization = membership?.organizations as OrganizationRow | null | undefined;
  if (!membership || !organization) return null;

  return {
    userId: user.id,
    email: user.email ?? "",
    fullName: profile?.full_name ?? null,
    role: membership.role,
    organization,
    isDemo: user.user_metadata?.is_demo === true,
  };
});

export async function requireSession(): Promise<SessionContext> {
  const session = await getSession();
  if (!session) redirect("/login");
  return session;
}

export function canManageOrganization(role: MemberRole): boolean {
  return role === "owner" || role === "admin";
}
