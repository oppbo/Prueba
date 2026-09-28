import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { DemoButton } from "@/components/auth/demo-button";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const params = await searchParams;
  const next = typeof params.next === "string" ? params.next : undefined;
  const confirmationError = params.error === "confirmation";
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Inicia sesión</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Bienvenido de vuelta. Revisa cómo van tus cobranzas.</p>
      {!isSupabaseConfigured() && (
        <p role="status" className="mt-5 rounded-lg border border-warning/25 bg-warning-soft px-3 py-2 text-sm text-warning-soft-foreground">
          Esta instalación aún no está conectada a su base de datos. El acceso estará disponible en breve.
        </p>
      )}
      {confirmationError && (
        <p role="alert" className="mt-5 rounded-lg border border-destructive/20 bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground">
          El enlace de confirmación no es válido o expiró. Inicia sesión o regístrate nuevamente.
        </p>
      )}
      <div className="mt-7">
        <LoginForm next={next} />
      </div>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <DemoButton />
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿No tienes cuenta?{" "}
        <Link href="/signup" className="font-medium text-primary hover:underline">
          Crea una gratis
        </Link>
      </p>
    </div>
  );
}
