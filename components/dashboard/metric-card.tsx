import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { formatBs } from "@/lib/format";
import { cn } from "@/lib/utils";

export function MetricCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  detail?: string;
  icon: LucideIcon;
  tone?: "neutral" | "danger" | "success" | "warning";
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-medium text-muted-foreground">{label}</p>
        <span
          className={cn(
            "flex size-8 items-center justify-center rounded-lg",
            tone === "danger" && "bg-destructive-soft text-destructive",
            tone === "success" && "bg-primary-soft text-primary",
            tone === "warning" && "bg-warning-soft text-warning",
            tone === "neutral" && "bg-muted text-zinc-600",
          )}
        >
          <Icon className="size-4" aria-hidden />
        </span>
      </div>
      <p className={cn("tabular mt-3 text-2xl font-semibold tracking-tight", tone === "danger" && value > 0 && "text-destructive")}>
        {formatBs(value)}
      </p>
      {detail && <p className="mt-1 text-[13px] text-muted-foreground">{detail}</p>}
    </Card>
  );
}
