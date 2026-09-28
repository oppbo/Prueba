import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // Skip static assets and the public payment page (it never needs a session).
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg|p/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|csv|txt)$).*)"],
};
