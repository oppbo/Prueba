import {
  BarChart3,
  Boxes,
  ClipboardList,
  HandCoins,
  Home,
  MessageSquareText,
  PackageCheck,
  Settings,
  Users,
  UserRoundCheck,
  type LucideIcon,
} from "lucide-react";
import type { Role } from "@/lib/types";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
  /** Label override per role (e.g. "Mis pedidos" for sellers). */
  labelFor?: Partial<Record<Role, string>>;
}

export const MAIN_NAV: NavItem[] = [
  { href: "/dashboard", label: "Inicio", icon: Home, roles: ["owner", "seller"], labelFor: { seller: "Mi día" } },
  { href: "/pedidos", label: "Pedidos", icon: ClipboardList, roles: ["owner", "seller", "warehouse"], labelFor: { seller: "Mis pedidos" } },
  { href: "/clientes", label: "Clientes", icon: Users, roles: ["owner", "seller"] },
  { href: "/inventario", label: "Inventario", icon: Boxes, roles: ["owner", "seller", "warehouse"], labelFor: { seller: "Productos" } },
  { href: "/cobranzas", label: "Cobranzas", icon: HandCoins, roles: ["owner"] },
  { href: "/almacen", label: "Almacén", icon: PackageCheck, roles: ["owner", "warehouse"] },
  { href: "/vendedores", label: "Vendedores", icon: UserRoundCheck, roles: ["owner"] },
  { href: "/reportes", label: "Reportes", icon: BarChart3, roles: ["owner"] },
];

export const ASSISTANT_NAV: NavItem = {
  href: "/asistente-pedidos",
  label: "Asistente de pedidos",
  icon: MessageSquareText,
  roles: ["owner", "seller"],
};

export const SETTINGS_NAV: NavItem = {
  href: "/configuracion",
  label: "Configuración",
  icon: Settings,
  roles: ["owner", "seller", "warehouse"],
};

/** Extra routes not in the menu, and who may open them. */
const EXTRA_ACCESS: { prefix: string; roles: Role[] }[] = [{ prefix: "/pedidos/nuevo", roles: ["owner", "seller"] }];

export const ROLE_HOME: Record<Role, string> = {
  owner: "/dashboard",
  seller: "/dashboard",
  warehouse: "/almacen",
};

export function navLabel(item: NavItem, role: Role): string {
  return item.labelFor?.[role] ?? item.label;
}

export function navForRole(role: Role): NavItem[] {
  return MAIN_NAV.filter((item) => item.roles.includes(role));
}

export function canAccess(pathname: string, role: Role): boolean {
  const extra = EXTRA_ACCESS.find((e) => pathname.startsWith(e.prefix));
  if (extra) return extra.roles.includes(role);
  const item = [...MAIN_NAV, ASSISTANT_NAV, SETTINGS_NAV].find((i) => pathname === i.href || pathname.startsWith(`${i.href}/`));
  return item ? item.roles.includes(role) : true;
}

export function isActive(pathname: string, href: string): boolean {
  if (href === "/pedidos") return pathname === "/pedidos" || (pathname.startsWith("/pedidos/") && !pathname.startsWith("/pedidos/nuevo"));
  return pathname === href || pathname.startsWith(`${href}/`);
}
