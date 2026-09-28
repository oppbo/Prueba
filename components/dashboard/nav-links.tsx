"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, HandCoins, LayoutDashboard, Settings, Upload, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/dashboard", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/customers", label: "Clientes", icon: Users },
  { href: "/dashboard/invoices", label: "Facturas", icon: FileText },
  { href: "/dashboard/collections", label: "Cobranza", icon: HandCoins },
  { href: "/dashboard/payments", label: "Pagos", icon: Wallet, badgeKey: "pendingPayments" as const },
  { href: "/dashboard/import", label: "Importar", icon: Upload },
  { href: "/dashboard/settings", label: "Configuración", icon: Settings },
];

export function NavLinks({ pendingPayments = 0, onNavigate }: { pendingPayments?: number; onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <ul className="grid gap-0.5">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const badge = item.badgeKey === "pendingPayments" ? pendingPayments : 0;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors",
                active ? "bg-primary-soft text-primary-soft-foreground" : "text-zinc-600 hover:bg-muted hover:text-foreground",
              )}
            >
              <item.icon className={cn("size-4", active ? "text-primary" : "text-zinc-400 group-hover:text-zinc-600")} aria-hidden />
              <span className="flex-1">{item.label}</span>
              {badge > 0 && (
                <span className="tabular rounded-full bg-warning-soft px-1.5 text-[11px] leading-5 font-semibold text-warning-soft-foreground">
                  {badge}
                  <span className="sr-only"> pagos por verificar</span>
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
