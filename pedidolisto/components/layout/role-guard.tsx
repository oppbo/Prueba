"use client";

import { usePathname } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/shared/empty-state";
import { ROLE_LABEL } from "@/lib/labels";
import { useRole } from "@/lib/store/hooks";
import { canAccess } from "./nav-config";
import { useSwitchRole } from "./user-menu";

/** Friendly message when the current demo role cannot open a page. */
export function RoleGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const role = useRole();
  const switchRole = useSwitchRole();
  if (canAccess(pathname, role)) return <>{children}</>;
  return (
    <div className="grid min-h-[60dvh] place-items-center">
      <EmptyState
        icon={Lock}
        title={`Esta sección no está disponible para el rol ${ROLE_LABEL[role]}`}
        description="En PedidoListo cada usuario ve solo lo que necesita para su trabajo."
        action={<Button onClick={() => switchRole("owner")}>Ver como Dueño</Button>}
      />
    </div>
  );
}
