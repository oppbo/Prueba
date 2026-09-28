"use client";

import { Bar, CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { formatBs, formatBsCompact, monthLabel } from "@/lib/format";
import type { MonthPoint } from "@/lib/data/dashboard";

// Validated palette (dataviz validator: light surface, CVD-safe pair).
const COLLECTED = "#0f8a67";
const OUTSTANDING = "#6d8cf0";

export function ReceivablesChart({ data }: { data: MonthPoint[] }) {
  const rows = data.map((d) => ({ ...d, label: monthLabel(d.month) }));
  return (
    <figure>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-1 text-[13px] text-muted-foreground" aria-hidden>
        <span className="inline-flex items-center gap-2">
          <span className="size-2.5 rounded-[3px]" style={{ background: COLLECTED }} /> Cobrado en el mes
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-0.5 w-4 rounded" style={{ background: OUTSTANDING }} /> Saldo por cobrar (fin de mes)
        </span>
      </div>
      <div className="h-64 w-full" aria-hidden>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barCategoryGap="32%">
            <CartesianGrid vertical={false} stroke="#ececef" />
            <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 12, fill: "#71717a" }} dy={6} />
            <YAxis
              tickLine={false}
              axisLine={false}
              width={72}
              tick={{ fontSize: 12, fill: "#71717a" }}
              tickFormatter={(v: number) => formatBsCompact(v)}
            />
            <Tooltip
              cursor={{ fill: "rgba(24,24,27,0.04)" }}
              content={({ active, payload, label }) =>
                active && payload?.length ? (
                  <div className="rounded-lg border border-border bg-card px-3 py-2 text-[13px] shadow-lg">
                    <p className="mb-1 font-medium">{label}</p>
                    {payload.map((p) => (
                      <p key={String(p.dataKey)} className="flex items-center gap-2 text-muted-foreground">
                        <span className="size-2 rounded-full" style={{ background: p.color }} />
                        {p.dataKey === "collected" ? "Cobrado" : "Saldo por cobrar"}:
                        <span className="tabular font-medium text-foreground">{formatBs(Number(p.value))}</span>
                      </p>
                    ))}
                  </div>
                ) : null
              }
            />
            <Bar dataKey="collected" fill={COLLECTED} radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
            <Line
              dataKey="outstanding"
              stroke={OUTSTANDING}
              strokeWidth={2}
              dot={{ r: 4, fill: OUTSTANDING, stroke: "#fff", strokeWidth: 2 }}
              activeDot={{ r: 5, stroke: "#fff", strokeWidth: 2 }}
              type="monotone"
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="sr-only">
        <table>
          <caption>Cobrado y saldo por cobrar de los últimos seis meses</caption>
          <thead>
            <tr>
              <th>Mes</th>
              <th>Cobrado</th>
              <th>Saldo por cobrar</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <td>{r.label}</td>
                <td>{formatBs(r.collected)}</td>
                <td>{formatBs(r.outstanding)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </figcaption>
    </figure>
  );
}
