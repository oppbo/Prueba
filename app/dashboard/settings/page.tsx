import type { Metadata } from "next";
import { Lock } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { OrganizationForm } from "@/components/settings/organization-form";
import { BankForm } from "@/components/settings/bank-form";
import { TemplatesForm } from "@/components/settings/templates-form";
import { canManageOrganization, requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { resolveTemplates } from "@/lib/whatsapp";

export const metadata: Metadata = { title: "Configuración" };

export default async function SettingsPage() {
  const session = await requireSession();
  const org = session.organization;
  const readOnly = !canManageOrganization(session.role);
  let qrUrl: string | null = null;
  if (org.bank_qr_path) {
    const supabase = await createClient();
    const { data } = await supabase.storage.from("org-assets").createSignedUrl(org.bank_qr_path, 60 * 30);
    qrUrl = data?.signedUrl ?? null;
  }

  return (
    <div className="grid gap-6">
      <PageHeader title="Configuración" description="Datos de tu empresa, cómo te pagan tus clientes y tus mensajes de cobranza." className="mb-0" />
      {readOnly && (
        <p className="flex items-center gap-2 rounded-lg border border-border bg-muted px-4 py-3 text-sm text-muted-foreground">
          <Lock className="size-4" aria-hidden /> Solo el propietario o un administrador puede editar la configuración.
        </p>
      )}
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Mi empresa</CardTitle>
            <CardDescription>Así te verán tus clientes en los recordatorios y la página de pago.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <OrganizationForm organization={org} disabled={readOnly} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Datos de pago</CardTitle>
            <CardDescription>Se muestran en la página de pago que recibe cada cliente.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <BankForm organization={org} qrUrl={qrUrl} disabled={readOnly} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Recordatorios</CardTitle>
            <CardDescription>Plantillas de WhatsApp. Siempre puedes editar el mensaje antes de abrir WhatsApp.</CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <TemplatesForm templates={resolveTemplates(org.reminder_templates)} disabled={readOnly} />
        </CardContent>
      </Card>
    </div>
  );
}
