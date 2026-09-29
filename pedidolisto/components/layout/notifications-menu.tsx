"use client";

import { useRouter } from "next/navigation";
import { AlertTriangle, Bell, ClipboardList, HandCoins, Info, PackageX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { formatTimeAgo } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { useData } from "@/lib/store/hooks";
import type { NotificationKind } from "@/lib/types";
import { cn } from "@/lib/utils";

const ICONS: Record<NotificationKind, { icon: typeof Bell; className: string }> = {
  stock: { icon: PackageX, className: "bg-warning-soft text-warning" },
  order: { icon: ClipboardList, className: "bg-info-soft text-info-soft-foreground" },
  debt: { icon: AlertTriangle, className: "bg-destructive-soft text-destructive" },
  payment: { icon: HandCoins, className: "bg-success-soft text-success" },
  system: { icon: Info, className: "bg-muted text-muted-foreground" },
};

export function NotificationsMenu() {
  const { notifications } = useData();
  const router = useRouter();
  const markRead = useDemoStore((s) => s.markNotificationRead);
  const markAllRead = useDemoStore((s) => s.markAllNotificationsRead);
  const unread = notifications.filter((n) => !n.read).length;
  const visible = notifications.slice(0, 8);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={`Notificaciones${unread ? `, ${unread} sin leer` : ""}`}>
          <Bell className="size-[18px]" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 grid min-w-4 place-items-center rounded-full bg-destructive px-1 text-[10px] leading-4 font-semibold text-white tabular">
              {unread}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[min(92vw,380px)] p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notificaciones</p>
          {unread > 0 && (
            <button type="button" onClick={markAllRead} className="text-xs font-medium text-primary hover:underline">
              Marcar todo como leído
            </button>
          )}
        </div>
        <div className="max-h-[420px] overflow-y-auto p-1">
          {visible.map((n) => {
            const meta = ICONS[n.kind];
            const Icon = meta.icon;
            return (
              <DropdownMenuItem
                key={n.id}
                onSelect={() => {
                  markRead(n.id);
                  router.push(n.href);
                }}
                className="items-start gap-3 px-3 py-2.5"
              >
                <span className={cn("mt-0.5 grid size-7 shrink-0 place-items-center rounded-md [&_svg]:!text-current", meta.className)}>
                  <Icon className="size-3.5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-[13px] leading-snug", !n.read && "font-semibold")}>{n.title}</span>
                  <span className="mt-0.5 block text-xs text-muted-foreground">{n.description}</span>
                  <span className="mt-1 block text-[11px] text-muted-foreground/80">{formatTimeAgo(n.date)}</span>
                </span>
                {!n.read && <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary" aria-label="Sin leer" />}
              </DropdownMenuItem>
            );
          })}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
