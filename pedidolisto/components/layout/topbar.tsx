"use client";

import Link from "next/link";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { useRole } from "@/lib/store/hooks";
import { useUiStore } from "@/lib/store/ui-store";
import { NotificationsMenu } from "./notifications-menu";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const role = useRole();
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-2 px-4 sm:px-6 lg:px-8">
        <Link href="/dashboard" className="lg:hidden" aria-label="Inicio">
          <Logo />
        </Link>
        <button
          type="button"
          onClick={() => setCommandOpen(true)}
          className="hidden h-9 w-full max-w-md items-center gap-2 rounded-md border border-border bg-card px-3 text-sm text-muted-foreground shadow-xs transition-colors hover:border-zinc-300 hover:text-foreground md:flex"
        >
          <Search className="size-4" />
          <span className="flex-1 text-left">Buscar cliente, pedido o producto...</span>
          <kbd className="rounded border border-border bg-muted px-1.5 py-0.5 font-sans text-[11px] font-medium">Ctrl + K</kbd>
        </button>
        <div className="ml-auto flex items-center gap-1">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setCommandOpen(true)} aria-label="Buscar">
            <Search className="size-[18px]" />
          </Button>
          {role !== "warehouse" && (
            <Button asChild size="sm" className="hidden md:inline-flex">
              <Link href="/pedidos/nuevo">
                <Plus /> Nuevo pedido
              </Link>
            </Button>
          )}
          <NotificationsMenu />
          <div className="lg:hidden">
            <UserMenu compact />
          </div>
        </div>
      </div>
    </header>
  );
}
