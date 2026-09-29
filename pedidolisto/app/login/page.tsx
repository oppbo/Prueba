import type { Metadata } from "next";
import { LoginForm } from "@/components/auth/login-form";
import { Logo } from "@/components/shared/logo";
import { CheckCircle2 } from "lucide-react";

export const metadata: Metadata = { title: "Ingresar" };

const POINTS = [
  "Pedidos de vendedores y WhatsApp en un solo lugar",
  "Crédito y deudas de cada cliente al instante",
  "Almacén sabe qué preparar sin llamadas",
];

export default function LoginPage() {
  return (
    <div className="grid min-h-dvh bg-background lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden border-r border-border bg-zinc-950 p-12 text-white lg:flex lg:flex-col">
        <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(#fff_1px,transparent_1px),linear-gradient(90deg,#fff_1px,transparent_1px)] [background-size:40px_40px]" />
        <div className="relative flex items-center gap-2.5">
          <Logo className="[&>span:last-child]:text-white" />
        </div>
        <div className="relative mt-auto max-w-lg">
          <p className="text-sm font-medium text-blue-300">Para distribuidoras y mayoristas en Bolivia</p>
          <h2 className="mt-3 text-4xl leading-tight font-semibold tracking-tight">Tu distribuidora, bajo control.</h2>
          <p className="mt-4 text-lg text-zinc-400">Pedidos, clientes, inventario y cobranzas en un solo lugar.</p>
          <ul className="mt-8 space-y-3">
            {POINTS.map((p) => (
              <li key={p} className="flex items-center gap-3 text-zinc-300">
                <CheckCircle2 className="size-5 shrink-0 text-blue-400" />
                {p}
              </li>
            ))}
          </ul>
        </div>
        <div className="relative mt-12 grid grid-cols-3 gap-4 border-t border-white/10 pt-6 text-sm">
          <div>
            <p className="text-2xl font-semibold tabular">84</p>
            <p className="text-zinc-400">pedidos al día</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular">360</p>
            <p className="text-zinc-400">clientes activos</p>
          </div>
          <div>
            <p className="text-2xl font-semibold tabular">4</p>
            <p className="text-zinc-400">vendedores en calle</p>
          </div>
        </div>
      </section>
      <section className="flex flex-col items-center justify-center px-5 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="lg:hidden">
            <Logo />
            <h1 className="mt-8 text-2xl font-semibold tracking-tight">Tu distribuidora, bajo control.</h1>
            <p className="mt-2 text-muted-foreground">Pedidos, clientes, inventario y cobranzas en un solo lugar.</p>
          </div>
          <div className="hidden lg:block">
            <h1 className="text-2xl font-semibold tracking-tight">Ingresa a tu cuenta</h1>
            <p className="mt-2 text-muted-foreground">Distribuidora Illimani · La Paz</p>
          </div>
          <LoginForm />
        </div>
      </section>
    </div>
  );
}
