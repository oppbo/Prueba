import * as React from "react";
import Link from "next/link";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatPercent } from "@/lib/format";
import { cn } from "@/lib/utils";

export function KpiCard({
  label,
  value,
  icon: Icon,
  change,
  changeLabel = "vs ayer",
  invertChange = false,
  hint,
  tone = "default",
  href,
  className,
  valueClassName,
}: {
  label: string;
  value: React.ReactNode;
  icon?: React.ComponentType<{ className?: string }>;
  change?: number | null;
  changeLabel?: string;
  /** When true, a decrease is good news (e.g. overdue debt). */
  invertChange?: boolean;
  hint?: React.ReactNode;
  tone?: "default" | "warning" | "danger" | "success";
  href?: string;
  className?: string;
  valueClassName?: string;
}) {
  const positive = change != null && (invertChange ? change <= 0 : change >= 0);
  const body = (
    <>
      <div className="flex items-center justify-between gap-2">
        <p className="line-clamp-2 text-[13px] leading-tight font-medium text-muted-foreground">{label}</p>
        {Icon && (
          <span
            className={cn(
              "grid size-7 shrink-0 place-items-center rounded-md",
              tone === "default" && "bg-muted text-muted-foreground",
              tone === "warning" && "bg-warning-soft text-warning",
              tone === "danger" && "bg-destructive-soft text-destructive",
              tone === "success" && "bg-success-soft text-success",
            )}
          >
            <Icon className="size-3.5" />
          </span>
        )}
      </div>
      <p className={cn("mt-2 text-[22px] leading-tight font-semibold tracking-tight tabular sm:text-2xl", valueClassName)}>{value}</p>
      <div className="mt-1.5 flex min-h-5 flex-wrap items-center gap-x-1.5 text-xs text-muted-foreground">
        {change != null && (
          <span className={cn("inline-flex items-center gap-0.5 font-medium", positive ? "text-success" : "text-destructive")}>
            {change >= 0 ? <ArrowUpRight className="size-3.5" /> : <ArrowDownRight className="size-3.5" />}
            {formatPercent(change, { signed: true })}
          </span>
        )}
        {change != null && <span>{changeLabel}</span>}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    </>
  );
  const classes = cn("block rounded-xl border border-border bg-card p-4 shadow-xs sm:p-5", className);
  if (href) {
    return (
      <Link href={href} className={cn(classes, "transition-colors hover:border-zinc-300 hover:bg-zinc-50/60")}>
        {body}
      </Link>
    );
  }
  return <div className={classes}>{body}</div>;
}
