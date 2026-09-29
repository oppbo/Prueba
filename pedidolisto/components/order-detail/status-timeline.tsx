import { Check, X } from "lucide-react";
import { ORDER_FLOW, ORDER_FLOW_LABELS } from "@/lib/labels";
import { formatTime } from "@/lib/format";
import type { OrderEvent, OrderStatus } from "@/lib/types";
import { cn } from "@/lib/utils";

export function StatusTimeline({ status, events }: { status: OrderStatus; events: OrderEvent[] }) {
  const cancelled = status === "cancelled";
  const reachedIndex = cancelled
    ? Math.max(...events.filter((e) => e.status && e.status !== "cancelled").map((e) => ORDER_FLOW.indexOf(e.status!)), 0)
    : ORDER_FLOW.indexOf(status);
  const timeFor = (s: OrderStatus) => {
    const e = [...events].reverse().find((ev) => ev.status === s);
    return e ? formatTime(e.at) : undefined;
  };

  return (
    <ol className="grid gap-0 sm:grid-cols-6">
      {ORDER_FLOW.map((s, i) => {
        const done = i <= reachedIndex;
        const current = i === reachedIndex && !cancelled;
        return (
          <li key={s} className="relative flex gap-3 pb-5 last:pb-0 sm:flex-col sm:items-center sm:gap-2 sm:pb-0 sm:text-center">
            {i < ORDER_FLOW.length - 1 && (
              <span
                className={cn(
                  "absolute top-7 left-[13px] h-[calc(100%-24px)] w-0.5 sm:top-[13px] sm:left-[calc(50%+16px)] sm:h-0.5 sm:w-[calc(100%-32px)]",
                  i < reachedIndex ? "bg-primary" : "bg-border",
                )}
                aria-hidden
              />
            )}
            <span
              className={cn(
                "relative z-10 grid size-7 shrink-0 place-items-center rounded-full border-2 text-xs font-semibold",
                done ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground",
                current && "ring-4 ring-primary/15",
              )}
            >
              {done ? <Check className="size-3.5" /> : i + 1}
            </span>
            <span className="min-w-0 pt-1 sm:pt-0">
              <span className={cn("block text-sm", done ? "font-medium text-foreground" : "text-muted-foreground")}>{ORDER_FLOW_LABELS[s]}</span>
              <span className="block text-xs text-muted-foreground tabular">{done ? timeFor(s) ?? "" : ""}</span>
            </span>
          </li>
        );
      })}
      {cancelled && (
        <li className="mt-4 flex items-center gap-2 rounded-lg bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground sm:col-span-6">
          <X className="size-4" /> Pedido cancelado a las {timeFor("cancelled")}
        </li>
      )}
    </ol>
  );
}
