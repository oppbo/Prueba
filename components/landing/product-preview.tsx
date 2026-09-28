import { AlertTriangle, CalendarClock, MessageCircle, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/shared/avatar";
import { LogoMark } from "@/components/shared/logo";
import { formatBs } from "@/lib/format";

/** Static product "screenshot" built from the real UI components (illustrative data). */
export function DashboardPreview() {
  const metrics = [
    { label: "Total por cobrar", value: 156920, icon: Wallet, className: "bg-muted text-zinc-600" },
    { label: "Vencido", value: 71860, icon: AlertTriangle, className: "bg-destructive-soft text-destructive", danger: true },
    { label: "Cobrado este mes", value: 17520, icon: TrendingUp, className: "bg-primary-soft text-primary" },
    { label: "Por vencer (7 días)", value: 41790, icon: CalendarClock, className: "bg-warning-soft text-warning" },
  ];
  const rows = [
    { name: "Repuestos Altiplano", invoice: "F-001203", amount: 11250, days: 64 },
    { name: "Importadora Nueva Era", invoice: "F-001215", amount: 16900, days: 38 },
    { name: "Distribuidora Túpac", invoice: "F-001218", amount: 7350, days: 22 },
  ];
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-background shadow-2xl shadow-zinc-900/10 ring-1 ring-zinc-900/5" aria-hidden>
      <div className="flex items-center gap-2 border-b border-border bg-card px-4 py-2.5">
        <span className="size-2.5 rounded-full bg-zinc-200" />
        <span className="size-2.5 rounded-full bg-zinc-200" />
        <span className="size-2.5 rounded-full bg-zinc-200" />
        <span className="ml-3 flex items-center gap-1.5 text-xs text-muted-foreground">
          <LogoMark className="size-4" /> cobraya · Inicio
        </span>
      </div>
      <div className="grid gap-4 p-4 sm:p-5">
        <div>
          <p className="text-lg font-semibold tracking-tight">Buenos días, María</p>
          <p className="text-[13px] text-muted-foreground">Así están tus cobranzas hoy.</p>
        </div>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {metrics.map((m) => (
            <div key={m.label} className="rounded-xl border border-border bg-card p-3.5">
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-muted-foreground">{m.label}</p>
                <span className={`flex size-6 items-center justify-center rounded-md ${m.className}`}>
                  <m.icon className="size-3.5" />
                </span>
              </div>
              <p className={`tabular mt-2 text-base font-semibold sm:text-lg ${m.danger ? "text-destructive" : ""}`}>{formatBs(m.value)}</p>
            </div>
          ))}
        </div>
        <div className="rounded-xl border border-border bg-card">
          <p className="border-b border-border px-4 py-3 text-sm font-semibold">Facturas que requieren atención</p>
          <ul className="divide-y divide-border">
            {rows.map((r) => (
              <li key={r.invoice} className="flex items-center gap-3 px-4 py-2.5">
                <Avatar name={r.name} className="size-7 text-[10px]" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13px] font-medium">{r.name}</p>
                  <p className="text-[11px] text-muted-foreground">{r.invoice}</p>
                </div>
                <Badge tone={r.days > 30 ? "danger" : "warning"} className="hidden sm:inline-flex">
                  {r.days} días
                </Badge>
                <span className="tabular w-24 text-right text-[13px] font-semibold">{formatBs(r.amount)}</span>
                <span className="inline-flex h-7 items-center gap-1 rounded-md bg-[#128c4a] px-2 text-[11px] font-medium text-white">
                  <MessageCircle className="size-3" /> <span className="hidden sm:inline">WhatsApp</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export function PhonePreview() {
  return (
    <div className="mx-auto w-[260px] rounded-[2.2rem] border-[7px] border-zinc-900 bg-zinc-900 shadow-2xl shadow-zinc-900/20" aria-hidden>
      <div className="overflow-hidden rounded-[1.7rem] bg-muted">
        <div className="grid gap-3 p-4">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-zinc-900 text-[10px] font-semibold text-white">DA</span>
            <div>
              <p className="text-[12px] font-semibold">Distribuidora Andina SRL</p>
              <p className="text-[10px] text-muted-foreground">La Paz</p>
            </div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">Monto pendiente</p>
              <Badge tone="danger" className="px-1.5 py-0 text-[9px]">
                Vencida
              </Badge>
            </div>
            <p className="tabular mt-1 text-xl font-semibold">Bs 3.450,00</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Factura F-001211 · vence 12 ago</p>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <p className="text-[11px] font-semibold">Escanea y paga</p>
            <div className="mx-auto mt-2 grid size-24 grid-cols-6 gap-0.5 rounded-md bg-white p-1.5">
              {Array.from({ length: 36 }).map((_, i) => (
                <span key={i} className={(i * 7 + (i % 5)) % 3 === 0 || i % 7 === 0 ? "bg-zinc-900" : "bg-transparent"} />
              ))}
            </div>
          </div>
          <span className="flex h-9 items-center justify-center rounded-lg bg-primary text-[12px] font-medium text-white">Ya realicé el pago</span>
        </div>
      </div>
    </div>
  );
}
