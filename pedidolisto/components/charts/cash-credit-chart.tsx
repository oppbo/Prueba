"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/domain/analytics";
import { formatDate, formatMoneyCompact } from "@/lib/format";
import { CHART_COLORS, ChartTooltipBox } from "./chart-tooltip";

export function CashCreditChart({ data, height = 260 }: { data: SeriesPoint[]; height?: number }) {
  const dense = data.length > 12;
  return (
    <div className="w-full">
      <div className="mb-3 flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.primary }} /> Contado
        </span>
        <span className="flex items-center gap-1.5">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: CHART_COLORS.credit }} /> Crédito
        </span>
      </div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 4, right: 4, left: -8, bottom: 0 }} barCategoryGap={dense ? "18%" : "28%"}>
            <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} interval={dense ? "preserveStartEnd" : 0} minTickGap={8} />
            <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} tickFormatter={formatMoneyCompact} width={62} />
            <Tooltip
              cursor={{ fill: "rgba(24,24,27,0.04)" }}
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const p = payload[0].payload as SeriesPoint;
                return (
                  <ChartTooltipBox
                    title={formatDate(p.date)}
                    rows={[
                      { label: "Contado", value: p.cash, color: CHART_COLORS.primary },
                      { label: "Crédito", value: p.credit, color: CHART_COLORS.credit },
                      { label: "Total", value: p.sales },
                    ]}
                  />
                );
              }}
            />
            <Bar dataKey="cash" stackId="a" fill={CHART_COLORS.primary} maxBarSize={48} stroke="#fff" strokeWidth={1} />
            <Bar dataKey="credit" stackId="a" fill={CHART_COLORS.credit} radius={[4, 4, 0, 0]} maxBarSize={48} stroke="#fff" strokeWidth={1} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
