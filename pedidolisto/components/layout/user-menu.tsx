"use client";

import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Check, ChevronsUpDown, LogOut, Settings } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ROLE_LABEL } from "@/lib/labels";
import { useDemoStore } from "@/lib/store/demo-store";
import { DEMO_USERS, useCurrentUser, useData } from "@/lib/store/hooks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ROLE_HOME } from "./nav-config";

const ROLES: Role[] = ["owner", "seller", "warehouse"];

export function useSwitchRole() {
  const router = useRouter();
  const setRole = useDemoStore((s) => s.setRole);
  return (role: Role) => {
    setRole(role);
    router.push(ROLE_HOME[role]);
    toast.success(`Ahora ves la demo como ${ROLE_LABEL[role]}`, { description: DEMO_USERS[role].name });
  };
}

export function UserMenu({ compact = false }: { compact?: boolean }) {
  const user = useCurrentUser();
  const data = useData();
  const router = useRouter();
  const switchRole = useSwitchRole();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          "flex items-center gap-2.5 rounded-lg text-left outline-none transition-colors hover:bg-zinc-100 focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "p-1" : "w-full p-2",
        )}
        aria-label="Menú de usuario"
      >
        <Avatar name={user.name} className={compact ? "size-8" : undefined} />
        {!compact && (
          <>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium">{user.name}</span>
              <span className="block truncate text-xs text-muted-foreground">
                {user.title} · {data.company.name}
              </span>
            </span>
            <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
          </>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={compact ? "end" : "start"} side={compact ? "bottom" : "top"} className="w-64">
        <div className="px-2 py-2">
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{data.company.name}</p>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Ver como</DropdownMenuLabel>
        {ROLES.map((role) => (
          <DropdownMenuItem key={role} onSelect={() => role !== user.role && switchRole(role)}>
            <span className="grid size-4 place-items-center">{role === user.role && <Check className="!text-primary" />}</span>
            <span className="flex-1">{ROLE_LABEL[role]}</span>
            <span className="text-xs text-muted-foreground">{DEMO_USERS[role].name.split(" ")[0]}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push("/configuracion")}>
          <Settings /> Configuración
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/login")}>
          <LogOut /> Cerrar sesión
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
