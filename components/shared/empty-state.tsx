import * as React from "react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col items-center justify-center px-6 py-12 text-center", className)}>
      <div className="mb-4 flex size-11 items-center justify-center rounded-xl border border-border bg-muted/60">
        <Icon className="size-5 text-muted-foreground" aria-hidden />
      </div>
      <p className="font-medium text-balance">{title}</p>
      {description && <p className="mt-1 max-w-sm text-sm text-muted-foreground text-balance">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
