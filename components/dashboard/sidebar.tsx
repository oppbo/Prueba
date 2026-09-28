import Link from "next/link";
import { Building2 } from "lucide-react";
import { Logo } from "@/components/shared/logo";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import type { MemberRole } from "@/types/database";

export type ShellProps = {
  organizationName: string;
  userName: string | null;
  email: string;
  role: MemberRole;
  pendingPayments: number;
};

export function SidebarContent({ organizationName, userName, email, role, pendingPayments, onNavigate }: ShellProps & { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 items-center px-4">
        <Link href="/dashboard" className="rounded-md" onClick={onNavigate} aria-label="CobraYa, ir al inicio">
          <Logo />
        </Link>
      </div>
      <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 py-2">
        <NavLinks pendingPayments={pendingPayments} onNavigate={onNavigate} />
      </nav>
      <div className="border-t border-border p-3">
        <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
          <Building2 className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate font-medium text-foreground/80">{organizationName}</span>
        </div>
        <UserMenu name={userName} email={email} role={role} />
      </div>
    </div>
  );
}
