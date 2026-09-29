import Link from "next/link";
import { Logo } from "@/components/shared/logo";

export default function NotFound() {
  return (
    <div className="grid min-h-dvh place-items-center px-6 text-center">
      <div>
        <Logo className="justify-center" />
        <h1 className="mt-8 text-2xl font-semibold tracking-tight">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">El enlace no existe o fue movido.</p>
        <Link href="/dashboard" className="mt-6 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary-hover">
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
