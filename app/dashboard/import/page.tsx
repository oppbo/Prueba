import type { Metadata } from "next";
import { PageHeader } from "@/components/shared/page-header";
import { ImportWizard } from "@/components/import/import-wizard";
import { requireSession } from "@/lib/session";

export const metadata: Metadata = { title: "Importar" };

export default async function ImportPage() {
  await requireSession();
  return (
    <div>
      <PageHeader title="Importar clientes y facturas" description="Carga tu cartera desde Excel (CSV) en minutos. Nada se importa sin tu confirmación." />
      <ImportWizard />
    </div>
  );
}
