import { LogOut } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { signOut } from "@/lib/actions/auth";
import { MEMBER_ROLE } from "@/lib/labels";
import type { MemberRole } from "@/types/database";

export function UserMenu({ name, email, role }: { name: string | null; email: string; role: MemberRole }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg p-1.5">
      <Avatar name={name ?? email} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{name ?? email}</p>
        <p className="truncate text-xs text-muted-foreground">{MEMBER_ROLE[role]}</p>
      </div>
      <form action={signOut}>
        <button
          type="submit"
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Cerrar sesión"
        >
          <LogOut className="size-4" aria-hidden />
          <span className="sr-only">Cerrar sesión</span>
        </button>
      </form>
    </div>
  );
}
