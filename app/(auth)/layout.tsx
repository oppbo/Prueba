import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function AuthLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="grid min-h-dvh lg:grid-cols-[1fr_1.05fr]">
      <div className="flex flex-col px-5 py-6 sm:px-10">
        <Link href="/" className="w-fit rounded-md" aria-label="CobraYa, ir al inicio">
          <Logo />
        </Link>
        <main className="flex flex-1 items-center justify-center py-10">
          <div className="w-full max-w-sm">{children}</div>
        </main>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} CobraYa · Hecho para empresas bolivianas</p>
      </div>
      <aside className="relative hidden overflow-hidden border-l border-border bg-zinc-950 lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{ backgroundImage: "radial-gradient(circle at 80% 10%, rgba(13,122,95,.55), transparent 45%)" }}
          aria-hidden
        />
        <div className="relative">
          <p className="text-sm font-medium text-emerald-300">Cuentas por cobrar</p>
          <h2 className="mt-3 max-w-md text-3xl font-semibold tracking-tight text-balance text-white">
            Cobra más rápido. Controla cada boliviano pendiente.
          </h2>
        </div>
        <figure className="relative max-w-md rounded-xl border border-white/10 bg-white/5 p-6 backdrop-blur">
          <blockquote className="text-[15px] leading-relaxed text-zinc-200">
            “Antes cobrábamos con un Excel y capturas de WhatsApp. Ahora vemos en un minuto quién debe, cuánto y desde cuándo.”
          </blockquote>
          <figcaption className="mt-4 text-sm text-zinc-400">Ejemplo ilustrativo · Distribuidora mayorista, La Paz</figcaption>
        </figure>
      </aside>
    </div>
  );
}
