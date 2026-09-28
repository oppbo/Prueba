import type { Metadata } from "next";
import Link from "next/link";
import { SignupForm } from "@/components/auth/signup-form";

export const metadata: Metadata = { title: "Crear cuenta" };

export default async function SignupPage({ searchParams }: PageProps<"/signup">) {
  const params = await searchParams;
  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Crea tu cuenta</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">Empieza a ordenar tus cuentas por cobrar en minutos.</p>
      {params.demo === "unavailable" && (
        <p className="mt-5 rounded-lg border border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
          La cuenta demo no está habilitada en este entorno. Crea tu cuenta y carga datos de ejemplo desde <strong>Importar</strong>.
        </p>
      )}
      <div className="mt-7">
        <SignupForm />
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-primary hover:underline">
          Inicia sesión
        </Link>
      </p>
    </div>
  );
}
