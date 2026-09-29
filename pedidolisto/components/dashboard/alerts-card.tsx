import Link from "next/link";
import { AlertTriangle, CalendarClock, ChevronRight, PackageOpen, PackageX } from "lucide-react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AlertItem {
  key: string;
  title: string;
  description: string;
  href: string;
  tone: "warning" | "danger" | "info";
  icon: "stock" | "debt" | "orders" | "due";
}

const ICONS = { stock: PackageX, debt: AlertTriangle, orders: PackageOpen, due: CalendarClock };

export function AlertsCard({ alerts }: { alerts: AlertItem[] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas</CardTitle>
        <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground tabular">{alerts.length}</span>
      </CardHeader>
      <ul className="space-y-1 px-2 pb-3">
        {alerts.map((a) => {
          const Icon = ICONS[a.icon];
          return (
            <li key={a.key}>
              <Link href={a.href} className="group flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/70">
                <span
                  className={cn(
                    "grid size-8 shrink-0 place-items-center rounded-lg",
                    a.tone === "warning" && "bg-warning-soft text-warning",
                    a.tone === "danger" && "bg-destructive-soft text-destructive",
                    a.tone === "info" && "bg-info-soft text-info-soft-foreground",
                  )}
                >
                  <Icon className="size-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium">{a.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{a.description}</span>
                </span>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
