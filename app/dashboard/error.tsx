"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <Card className="mx-auto mt-10 max-w-lg p-8 text-center">
      <AlertTriangle className="mx-auto size-8 text-warning" aria-hidden />
      <h1 className="mt-3 text-lg font-semibold">No pudimos cargar esta sección</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Puede ser un problema de conexión. Intenta nuevamente; si persiste, contáctanos.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-muted-foreground">Código: {error.digest}</p>}
      <Button className="mt-6" onClick={reset}>
        <RotateCcw /> Reintentar
      </Button>
    </Card>
  );
}
