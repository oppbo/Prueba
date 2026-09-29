"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, Check, Database, Plug, RotateCcw, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/shared/page-header";
import { Avatar } from "@/components/shared/avatar";
import { useSwitchRole } from "@/components/layout/user-menu";
import { ROLE_LABEL } from "@/lib/labels";
import { formatDateTime, formatNumber, formatPhone } from "@/lib/format";
import { useDemoStore } from "@/lib/store/demo-store";
import { DEMO_USERS, useData, useRole } from "@/lib/store/hooks";
import type { Role } from "@/lib/types";
import { cn } from "@/lib/utils";

const ROLE_DESCRIPTION: Record<Role, string> = {
  owner: "Ve todo: ventas, cobranzas, inventario, vendedores y reportes.",
  seller: "Clientes, nuevos pedidos, productos y saldo de sus clientes.",
  warehouse: "Pedidos por preparar, cambios de estado e inventario.",
};

const INTEGRATIONS = [
  { name: "WhatsApp Business", description: "Recibir pedidos y enviar recordatorios automáticamente." },
  { name: "Facturación electrónica (SIN)", description: "Emitir facturas desde cada pedido." },
  { name: "Bancos y QR", description: "Conciliar pagos por transferencia." },
];

export default function SettingsPage() {
  const data = useData();
  const role = useRole();
  const router = useRouter();
  const resetDemo = useDemoStore((s) => s.resetDemo);
  const switchRole = useSwitchRole();
  const [confirming, setConfirming] = useState(false);

  const reset = () => {
    resetDemo();
    setConfirming(false);
    toast.success("Datos de demostración restablecidos", { description: "La demo volvió a su estado inicial." });
    router.push(role === "warehouse" ? "/almacen" : "/dashboard");
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <PageHeader title="Configuración" description="Empresa, usuarios y datos de la demostración." />

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-muted-foreground" /> Empresa
            </CardTitle>
            <CardDescription>Datos generales que aparecen en mensajes y reportes.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-4 text-sm sm:grid-cols-2">
            {[
              ["Razón social", data.company.name],
              ["Ciudad", data.company.city],
              ["Rubro", data.company.industry],
              ["Teléfono", formatPhone(data.company.phone)],
              ["Moneda", "Bolivianos (Bs)"],
              ["Catálogo", `${formatNumber(data.products.length)} productos · ${formatNumber(data.customers.length)} clientes`],
            ].map(([k, v]) => (
              <div key={k}>
                <dt className="text-muted-foreground">{k}</dt>
                <dd className="mt-0.5 font-medium">{v}</dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="size-4 text-muted-foreground" /> Usuarios y roles
            </CardTitle>
            <CardDescription>Cambia de rol para ver la demo como cada usuario.</CardDescription>
          </div>
        </CardHeader>
        <ul className="divide-y divide-border border-t border-border">
          {(Object.keys(DEMO_USERS) as Role[]).map((r) => (
            <li key={r} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
              <div className="flex flex-1 items-center gap-3">
                <Avatar name={DEMO_USERS[r].name} />
                <div className="min-w-0">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    {DEMO_USERS[r].name} <Badge>{ROLE_LABEL[r]}</Badge>
                  </p>
                  <p className="text-xs text-muted-foreground">{ROLE_DESCRIPTION[r]}</p>
                </div>
              </div>
              {r === role ? (
                <span className="inline-flex items-center gap-1 text-sm font-medium text-success">
                  <Check className="size-4" /> Rol actual
                </span>
              ) : (
                <Button size="sm" variant="secondary" onClick={() => switchRole(r)}>
                  Ver como {ROLE_LABEL[r]}
                </Button>
              )}
            </li>
          ))}
        </ul>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Plug className="size-4 text-muted-foreground" /> Integraciones
            </CardTitle>
            <CardDescription>Disponibles en próximas versiones.</CardDescription>
          </div>
        </CardHeader>
        <ul className="divide-y divide-border border-t border-border">
          {INTEGRATIONS.map((i) => (
            <li key={i.name} className="flex items-center justify-between gap-4 px-5 py-3.5">
              <div>
                <p className="text-sm font-medium">{i.name}</p>
                <p className="text-xs text-muted-foreground">{i.description}</p>
              </div>
              <Badge>Próximamente</Badge>
            </li>
          ))}
        </ul>
      </Card>

      <Card className={cn("border-warning/30")}>
        <CardHeader>
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="size-4 text-muted-foreground" /> Datos de demostración
            </CardTitle>
            <CardDescription>
              Los cambios que hagas (pedidos, pagos, ajustes) se guardan en este navegador. Datos generados: {formatDateTime(data.seededAt)}.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">
            {formatNumber(data.orders.length)} pedidos · {formatNumber(data.payments.length)} pagos registrados
          </p>
          <Button variant="secondary" onClick={() => setConfirming(true)}>
            <RotateCcw /> Restablecer demo
          </Button>
        </CardContent>
      </Card>

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>¿Restablecer la demo?</DialogTitle>
            <DialogDescription>Se borrarán los pedidos, pagos y ajustes creados en esta sesión.</DialogDescription>
          </DialogHeader>
          <DialogBody>
            <p className="text-sm text-muted-foreground">Los datos volverán al estado inicial de Distribuidora Illimani. Esta acción no se puede deshacer.</p>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setConfirming(false)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={reset}>
              Restablecer datos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
