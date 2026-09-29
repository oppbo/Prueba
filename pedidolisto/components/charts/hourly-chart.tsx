"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { HourPoint } from "@/lib/domain/analytics";
import { formatMoneyCompact } from "@/lib/format";
import { CHART_COLORS, ChartTooltipBox } from "./chart-tooltip";

export function HourlyChart({ data, height = 260 }: { data: HourPoint[]; height?: number }) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: -8, bottom: 0 }} barCategoryGap="20%">
          <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} interval="preserveStartEnd" minTickGap={10} />
          <YAxis tickLine={false} axisLine={false} tick={{ fill: CHART_COLORS.axis, fontSize: 12 }} tickFormatter={formatMoneyCompact} width={62} />
          <Tooltip
            cursor={{ fill: "rgba(24,24,27,0.04)" }}
            content={({ active, payload }) => {
              if (!active || !payload?.length) return null;
              const p = payload[0].payload as HourPoint;
              return (
                <ChartTooltipBox
                  title={`${p.label} – ${p.label.replace(":00", ":59")}`}
                  rows={[
                    { label: "Ventas", value: p.sales, color: CHART_COLORS.primary },
                    { label: "Pedidos", value: p.orders, kind: "number" },
                  ]}
                />
              );
            }}
          />
          <Bar dataKey="sales" fill={CHART_COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={40} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
