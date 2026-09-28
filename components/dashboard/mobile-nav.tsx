"use client";

import { useState } from "react";
import { Menu } from "lucide-react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Dialog, SheetContent } from "@/components/ui/dialog";
import type { ShellProps } from "./sidebar";
import { NavLinks } from "./nav-links";
import { Logo } from "@/components/shared/logo";
import { Building2 } from "lucide-react";

/** Mobile top bar + slide-over navigation. The user menu is rendered by the server. */
export function MobileNav({ organizationName, pendingPayments, userMenu }: Pick<ShellProps, "organizationName" | "pendingPayments"> & { userMenu: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogPrimitive.Trigger className="-ml-1.5 rounded-md p-2 text-foreground hover:bg-muted" aria-label="Abrir menú">
        <Menu className="size-5" aria-hidden />
      </DialogPrimitive.Trigger>
      <SheetContent aria-describedby={undefined}>
        <DialogPrimitive.Title className="sr-only">Menú</DialogPrimitive.Title>
        <div className="flex h-16 items-center px-4">
          <Logo />
        </div>
        <nav aria-label="Navegación principal" className="flex-1 overflow-y-auto px-3 py-2">
          <NavLinks pendingPayments={pendingPayments} onNavigate={() => setOpen(false)} />
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-1 flex items-center gap-2 px-2 py-1.5 text-xs text-muted-foreground">
            <Building2 className="size-3.5" aria-hidden />
            <span className="truncate font-medium text-foreground/80">{organizationName}</span>
          </div>
          {userMenu}
        </div>
      </SheetContent>
    </Dialog>
  );
}
