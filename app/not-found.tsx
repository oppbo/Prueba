import Link from "next/link";
import { Logo } from "@/components/shared/logo";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">No encontramos esta página</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Puede que el enlace esté mal escrito, que el registro haya sido eliminado o que no tengas acceso.
      </p>
      <div className="mt-6 flex gap-2">
        <Link href="/" className={buttonVariants({ variant: "secondary" })}>
          Ir al inicio
        </Link>
        <Link href="/dashboard" className={buttonVariants()}>
          Ir al panel
        </Link>
      </div>
    </main>
  );
}
