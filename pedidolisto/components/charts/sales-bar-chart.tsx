"use client";

import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { SeriesPoint } from "@/lib/domain/analytics";
import { formatDate, formatMoneyCompact } from "@/lib/format";
import { CHART_COLORS, ChartTooltipBox } from "./chart-tooltip";

/** Daily sales bars; the latest day (today) is emphasized. */
export function SalesBarChart({ data, height = 260 }: { data: SeriesPoint[]; height?: number }) {
  const dense = data.length > 12;
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap={dense ? "18%" : "28%"}>
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tick={{ fill: CHART_COLORS.axis, fontSize: 12 }}
            interval={dense ? "preserveStartEnd" : 0}
            minTickGap={8}
          />
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
                    { label: "Ventas", value: p.sales, color: CHART_COLORS.primary },
                    { label: "Pedidos", value: p.orders, kind: "number" },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="sales" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((p, i) => (
              <Cell key={p.date} fill={i === data.length - 1 ? CHART_COLORS.primary : CHART_COLORS.primaryMuted} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
