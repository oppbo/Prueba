import { formatMoney, formatNumber } from "@/lib/format";

export interface TooltipRow {
  label: string;
  value: number;
  color?: string;
  kind?: "money" | "number";
}

export function ChartTooltipBox({ title, rows }: { title: string; rows: TooltipRow[] }) {
  return (
    <div className="min-w-40 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-lg">
      <p className="mb-1.5 font-medium text-foreground">{title}</p>
      <div className="space-y-1">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between gap-4">
            <span className="flex items-center gap-1.5 text-muted-foreground">
              {r.color && <span className="size-2 rounded-sm" style={{ backgroundColor: r.color }} />}
              {r.label}
            </span>
            <span className="font-medium text-foreground tabular">{r.kind === "number" ? formatNumber(r.value) : formatMoney(r.value)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export const CHART_COLORS = {
  primary: "#3350d6",
  primaryMuted: "#a9b7ee",
  credit: "#e08a1e",
  grid: "#ececf0",
  axis: "#8a8a94",
};
