import { LinkIcon } from "lucide-react";
import { LogoMark } from "@/components/shared/logo";

export default function PaymentLinkNotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-muted/60 px-6 text-center">
      <span className="flex size-12 items-center justify-center rounded-xl border border-border bg-card">
        <LinkIcon className="size-5 text-muted-foreground" aria-hidden />
      </span>
      <h1 className="mt-4 text-xl font-semibold">Enlace de pago no disponible</h1>
      <p className="mt-2 max-w-xs text-sm text-muted-foreground">
        El enlace no es válido o fue desactivado. Pide a la empresa que te envíe un nuevo enlace de pago.
      </p>
      <p className="mt-8 flex items-center gap-1.5 text-xs text-muted-foreground">
        <LogoMark className="size-4" /> CobraYa
      </p>
    </main>
  );
}
