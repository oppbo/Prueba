import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Check,
  FileSpreadsheet,
  FileUp,
  HandCoins,
  MessageCircle,
  QrCode,
  Receipt,
  ShieldCheck,
  Timer,
  Users,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Logo } from "@/components/shared/logo";
import { DemoButton } from "@/components/auth/demo-button";
import { DashboardPreview, PhonePreview } from "@/components/landing/product-preview";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "CobraYa — Cobra más rápido. Controla cada boliviano pendiente.",
};

const PROBLEMS = [
  { icon: FileSpreadsheet, title: "Excel desactualizado", text: "Nadie sabe con certeza cuánto se debe hoy ni desde cuándo." },
  { icon: MessageCircle, title: "WhatsApp desordenado", text: "Recordatorios sueltos, sin historial y dependiendo de la memoria de cada vendedor." },
  { icon: Receipt, title: "Capturas por todos lados", text: "Comprobantes de transferencia perdidos entre chats, correos y fotos." },
];

const STEPS = [
  { icon: FileUp, title: "Carga tu cartera", text: "Importa tu Excel (CSV) o registra facturas. Detectamos las columnas automáticamente." },
  { icon: MessageCircle, title: "Recuerda por WhatsApp", text: "Mensajes listos y editables, con el link de pago de cada factura." },
  { icon: QrCode, title: "Tu cliente paga con QR", text: "Ve el monto, escanea el QR de tu banco y sube su comprobante." },
  { icon: Check, title: "Verificas y listo", text: "Confirmas el pago y el saldo se actualiza solo. Sin doble registro." },
];

const FEATURES = [
  { icon: BarChart3, title: "Panel de cuentas por cobrar", text: "Total por cobrar, vencido, cobrado del mes y lo que vence esta semana." },
  { icon: HandCoins, title: "Lista de cobranza diaria", text: "Facturas priorizadas por días de atraso y monto, con acciones en un clic." },
  { icon: MessageCircle, title: "Recordatorios por WhatsApp", text: "Plantillas para antes, el día y después del vencimiento, editables." },
  { icon: QrCode, title: "Página de pago para tu cliente", text: "Optimizada para celular, con tu QR bancario y carga de comprobante." },
  { icon: Receipt, title: "Verificación de comprobantes", text: "Revisa, aprueba o rechaza. Protegido contra doble descuento." },
  { icon: Users, title: "Historial por cliente", text: "Facturas, pagos, notas y cada contacto en una sola línea de tiempo." },
  { icon: FileSpreadsheet, title: "Importación desde Excel", text: "Valida fila por fila y te muestra exactamente qué corregir." },
  { icon: ShieldCheck, title: "Datos aislados y seguros", text: "Cada empresa ve solo su información. Archivos privados y cifrados en tránsito." },
];

const AUDIENCE = [
  "Distribuidoras",
  "Importadoras",
  "Ferreterías mayoristas",
  "Repuestos automotrices",
  "Imprentas",
  "Agencias",
  "Servicios empresariales",
  "Proveedores que venden al crédito",
];

const PLANS = [
  { name: "Inicial", price: "149", text: "Para empezar a ordenar tu cartera.", items: ["1 usuario", "Hasta 100 clientes", "Recordatorios por WhatsApp", "Página de pago con QR"] },
  {
    name: "Negocio",
    price: "299",
    text: "Para equipos de venta y cobranza.",
    items: ["3 usuarios", "Clientes ilimitados", "Importación desde Excel", "Verificación de comprobantes"],
    featured: true,
  },
  { name: "Pro", price: "599", text: "Para distribuidoras con alto volumen.", items: ["10 usuarios", "Todo lo de Negocio", "Soporte prioritario", "Integraciones (próximamente)"] },
];

export default function LandingPage() {
  return (
    <div className="min-h-dvh bg-card">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-card/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Link href="/" aria-label="CobraYa, inicio">
            <Logo />
          </Link>
          <nav aria-label="Principal" className="hidden items-center gap-7 text-sm text-muted-foreground md:flex">
            <a href="#como-funciona" className="hover:text-foreground">
              Cómo funciona
            </a>
            <a href="#funciones" className="hover:text-foreground">
              Funciones
            </a>
            <a href="#precios" className="hover:text-foreground">
              Precios
            </a>
          </nav>
          <div className="flex items-center gap-2">
            <Link href="/login" className={buttonVariants({ variant: "ghost", size: "sm" })}>
              Iniciar sesión
            </Link>
            <Link href="/signup" className={cn(buttonVariants({ size: "sm" }), "hidden sm:inline-flex")}>
              Crear cuenta
            </Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative overflow-hidden border-b border-border bg-background">
          <div
            className="pointer-events-none absolute inset-0 opacity-60"
            style={{ backgroundImage: "radial-gradient(ellipse 60% 50% at 50% -10%, rgba(13,122,95,.14), transparent)" }}
            aria-hidden
          />
          <div className="relative mx-auto max-w-6xl px-4 pt-16 pb-16 sm:px-6 sm:pt-24">
            <div className="mx-auto max-w-3xl text-center">
              <p className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary-soft px-3 py-1 text-[13px] font-medium text-primary-soft-foreground">
                <Timer className="size-3.5" aria-hidden /> Cuentas por cobrar para empresas bolivianas
              </p>
              <h1 className="mt-6 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">
                Cobra más rápido. <span className="text-primary">Sin perseguir pagos todo el día.</span>
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-balance text-muted-foreground">
                CobraYa organiza tus cuentas por cobrar, te ayuda a contactar clientes por WhatsApp y mantiene todos tus pagos pendientes bajo
                control.
              </p>
              <div className="mx-auto mt-9 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
                <DemoButton variant="default" className="w-full sm:w-auto">
                  Probar demo
                </DemoButton>
                <Link href="/login" className={cn(buttonVariants({ variant: "secondary", size: "lg" }), "w-full sm:w-auto")}>
                  Iniciar sesión
                </Link>
              </div>
              <p className="mt-4 text-[13px] text-muted-foreground">La demo usa datos ficticios de una distribuidora de La Paz.</p>
            </div>
            <div className="mx-auto mt-14 max-w-5xl">
              <DashboardPreview />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="problema">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">El problema</p>
            <h2 id="problema" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              Vender al crédito es fácil. Cobrar a tiempo, no tanto.
            </h2>
            <p className="mt-4 text-muted-foreground">
              La mayoría de las empresas cobra con un Excel, WhatsApp, capturas de transferencias y llamadas. El resultado: plata que se atrasa y
              horas perdidas cada semana.
            </p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {PROBLEMS.map((p) => (
              <div key={p.title} className="rounded-xl border border-border bg-background p-6">
                <p.icon className="size-5 text-destructive" aria-hidden />
                <h3 className="mt-4 font-semibold">{p.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{p.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="como-funciona" className="border-y border-border bg-background" aria-labelledby="como-funciona-title">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-4 py-20 sm:px-6 lg:grid-cols-[1.2fr_1fr]">
            <div>
              <p className="text-sm font-semibold text-primary">Cómo funciona</p>
              <h2 id="como-funciona-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
                De la factura al pago verificado, en cuatro pasos
              </h2>
              <ol className="mt-10 grid gap-7">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground">
                      <s.icon className="size-5" aria-hidden />
                    </span>
                    <div>
                      <h3 className="font-semibold">
                        <span className="text-muted-foreground">{i + 1}.</span> {s.title}
                      </h3>
                      <p className="mt-1 text-sm text-muted-foreground">{s.text}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <PhonePreview />
          </div>
        </section>

        <section id="funciones" className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="funciones-title">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold text-primary">Funciones</p>
            <h2 id="funciones-title" className="mt-2 text-3xl font-semibold tracking-tight text-balance">
              Todo lo que necesitas para cobrar. Nada de lo que no.
            </h2>
            <p className="mt-4 text-muted-foreground">CobraYa no es un ERP ni un sistema contable: es tu herramienta enfocada en cobranza.</p>
          </div>
          <div className="mt-10 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-card p-6">
                <f.icon className="size-5 text-primary" aria-hidden />
                <h3 className="mt-4 text-[15px] font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{f.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="border-y border-border bg-zinc-950 text-white" aria-labelledby="para-quien">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 id="para-quien" className="text-2xl font-semibold tracking-tight">
              Hecho para empresas que venden al crédito en Bolivia
            </h2>
            <ul className="mt-6 flex flex-wrap gap-2">
              {AUDIENCE.map((a) => (
                <li key={a} className="rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 text-sm text-zinc-200">
                  {a}
                </li>
              ))}
            </ul>
            <p className="mt-6 max-w-2xl text-sm text-zinc-400">Montos en bolivianos, números con +591 y fechas en hora de La Paz, desde el primer día.</p>
          </div>
        </section>

        <section id="precios" className="mx-auto max-w-6xl px-4 py-20 sm:px-6" aria-labelledby="precios-title">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold text-primary">Precios</p>
            <h2 id="precios-title" className="mt-2 text-3xl font-semibold tracking-tight">
              Planes simples, en bolivianos
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Precios referenciales. Durante el piloto CobraYa es gratuito; aún no cobramos suscripciones.
            </p>
          </div>
          <div className="mt-10 grid gap-4 lg:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={cn(
                  "flex flex-col rounded-2xl border bg-card p-6",
                  plan.featured ? "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary" : "border-border",
                )}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{plan.name}</h3>
                  {plan.featured && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-xs font-medium text-primary-soft-foreground">Más elegido</span>}
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{plan.text}</p>
                <p className="mt-6">
                  <span className="tabular text-4xl font-semibold tracking-tight">Bs {plan.price}</span>
                  <span className="text-sm text-muted-foreground"> / mes</span>
                </p>
                <ul className="mt-6 grid flex-1 gap-2.5 text-sm">
                  {plan.items.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <Check className="size-4 text-primary" aria-hidden /> {item}
                    </li>
                  ))}
                </ul>
                <Link href="/signup" className={cn(buttonVariants({ variant: plan.featured ? "default" : "secondary" }), "mt-8 w-full")}>
                  Probar gratis
                </Link>
              </div>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">Vista previa de precios: el cobro de suscripciones aún no está disponible.</p>
        </section>

        <section className="px-4 pb-20 sm:px-6">
          <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl bg-primary px-6 py-14 text-center text-primary-foreground sm:px-12">
            <h2 className="text-3xl font-semibold tracking-tight text-balance">Cobra más rápido. Controla cada boliviano pendiente.</h2>
            <p className="mx-auto mt-3 max-w-xl text-primary-foreground/80">Cuentas por cobrar, recordatorios y pagos en un solo lugar.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link href="/signup" className={cn(buttonVariants({ size: "lg", variant: "secondary" }), "border-transparent")}>
                Crear cuenta gratis <ArrowRight />
              </Link>
              <DemoButton variant="ghost" className="w-full text-primary-foreground hover:bg-white/10 sm:w-auto">
                Ver la demo
              </DemoButton>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted-foreground sm:flex-row sm:px-6">
          <Logo />
          <p>© {new Date().getFullYear()} CobraYa · Hecho en Bolivia</p>
        </div>
      </footer>
    </div>
  );
}
