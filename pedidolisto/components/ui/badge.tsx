import * as React from "react";
import { cn } from "@/lib/utils";
import type { Tone } from "@/lib/labels";

const tones: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground ring-zinc-500/15",
  success: "bg-success-soft text-success-soft-foreground ring-success/20",
  warning: "bg-warning-soft text-warning-soft-foreground ring-warning/20",
  danger: "bg-destructive-soft text-destructive-soft-foreground ring-destructive/20",
  info: "bg-info-soft text-info-soft-foreground ring-blue-600/15",
  brand: "bg-primary-soft text-primary-soft-foreground ring-primary/25",
  violet: "bg-violet-soft text-violet-soft-foreground ring-violet-600/15",
};

export function Badge({
  tone = "neutral",
  dot = false,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: Tone; dot?: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset",
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  );
}
