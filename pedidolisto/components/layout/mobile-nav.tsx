"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Menu, Plus, X } from "lucide-react";
import { useRole } from "@/lib/store/hooks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";
import { MAIN_NAV, isActive, navLabel, type NavItem } from "./nav-config";
import { SettingsLink, SidebarNav } from "./sidebar";

/** Primary tabs per role in the bottom bar (the rest live under "Más"). */
const PRIMARY: Record<Role, string[]> = {
  owner: ["/dashboard", "/pedidos", "/clientes"],
  seller: ["/dashboard", "/pedidos", "/clientes"],
  warehouse: ["/almacen", "/pedidos", "/inventario"],
};

function Tab({ item, role }: { item: NavItem; role: Role }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn("flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium", active ? "text-primary" : "text-muted-foreground")}
      aria-current={active ? "page" : undefined}
    >
      <Icon className="size-5" />
      <span className="max-w-full truncate">{navLabel(item, role)}</span>
    </Link>
  );
}

export function MobileNav() {
  const role = useRole();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const tabs = PRIMARY[role].map((href) => MAIN_NAV.find((i) => i.href === href)!).filter(Boolean);
  const canOrder = role !== "warehouse";
  // The order form has its own sticky action bar.
  if (pathname.startsWith("/pedidos/nuevo")) return null;

  return (
    <>
      <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur lg:hidden" aria-label="Navegación inferior">
        <div className="flex h-16 items-stretch">
          {tabs.slice(0, 2).map((item) => (
            <Tab key={item.href} item={item} role={role} />
          ))}
          {canOrder && (
            <div className="flex flex-1 items-center justify-center">
              <Link
                href="/pedidos/nuevo"
                className="grid size-12 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 transition-transform active:scale-95"
                aria-label="Nuevo pedido"
              >
                <Plus className="size-6" />
              </Link>
            </div>
          )}
          {tabs.slice(2).map((item) => (
            <Tab key={item.href} item={item} role={role} />
          ))}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium text-muted-foreground"
          >
            <Menu className="size-5" />
            Más
          </button>
        </div>
      </nav>

      <DialogPrimitive.Root open={open} onOpenChange={setOpen}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-zinc-950/40 data-[state=open]:animate-in lg:hidden" />
          <DialogPrimitive.Content
            className="pb-safe fixed inset-x-0 bottom-0 z-50 max-h-[85dvh] overflow-y-auto rounded-t-2xl border-t border-border bg-card shadow-2xl outline-none data-[state=open]:animate-slide-up lg:hidden"
            aria-describedby={undefined}
          >
            <div className="flex items-center justify-between px-5 pt-4 pb-2">
              <DialogPrimitive.Title className="text-sm font-semibold">Menú</DialogPrimitive.Title>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
                  Modo demo
                </span>
                <DialogPrimitive.Close className="rounded-md p-1.5 text-muted-foreground hover:bg-muted" aria-label="Cerrar menú">
                  <X className="size-4" />
                </DialogPrimitive.Close>
              </div>
            </div>
            <div className="space-y-1 px-3 pb-4">
              <SidebarNav onNavigate={() => setOpen(false)} />
              <div className="my-3 h-px bg-border" />
              <SettingsLink onNavigate={() => setOpen(false)} />
            </div>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    </>
  );
}
