"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "@/components/shared/logo";
import { useRole } from "@/lib/store/hooks";
import { cn } from "@/lib/utils";
import { ASSISTANT_NAV, SETTINGS_NAV, isActive, navForRole, navLabel, type NavItem } from "./nav-config";
import { UserMenu } from "./user-menu";

function NavLink({ item, label, onNavigate }: { item: NavItem; label: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group flex h-9 items-center gap-2.5 rounded-md px-2.5 text-sm font-medium transition-colors",
        active ? "bg-card text-foreground shadow-xs ring-1 ring-border" : "text-muted-foreground hover:bg-zinc-100 hover:text-foreground",
      )}
    >
      <Icon className={cn("size-4 shrink-0", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
      <span className="truncate">{label}</span>
    </Link>
  );
}

export function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const role = useRole();
  const items = navForRole(role);
  const showAssistant = ASSISTANT_NAV.roles.includes(role);
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Principal">
      {items.map((item) => (
        <NavLink key={item.href} item={item} label={navLabel(item, role)} onNavigate={onNavigate} />
      ))}
      {showAssistant && (
        <>
          <div className="my-3 h-px bg-border" />
          <NavLink item={ASSISTANT_NAV} label={ASSISTANT_NAV.label} onNavigate={onNavigate} />
        </>
      )}
    </nav>
  );
}

export function SettingsLink({ onNavigate }: { onNavigate?: () => void }) {
  return <NavLink item={SETTINGS_NAV} label={SETTINGS_NAV.label} onNavigate={onNavigate} />;
}

export function Sidebar() {
  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-sidebar lg:flex">
      <div className="flex h-14 items-center justify-between px-4">
        <Link href="/dashboard" aria-label="PedidoListo, inicio">
          <Logo />
        </Link>
        <span className="rounded-full border border-dashed border-zinc-300 px-2 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase">
          Modo demo
        </span>
      </div>
      <div className="flex-1 overflow-y-auto px-3 pt-2 pb-4">
        <SidebarNav />
      </div>
      <div className="space-y-2 border-t border-border p-3">
        <SettingsLink />
        <UserMenu />
      </div>
    </aside>
  );
}
