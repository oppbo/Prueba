"use client";

import { useState, useTransition } from "react";
import { Check, Link2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { preparePaymentLink } from "@/lib/actions/collections";

/** Creates (or reuses) the invoice's public payment link and copies it. */
export function PaymentLinkButton({ invoiceId }: { invoiceId: string }) {
  const [pending, startTransition] = useTransition();
  const [url, setUrl] = useState<string | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        variant="secondary"
        loading={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await preparePaymentLink(invoiceId);
            if (!result.ok) {
              toast.error(result.error);
              return;
            }
            setUrl(result.data.url);
            try {
              await navigator.clipboard.writeText(result.data.url);
              toast.success("Link de pago copiado");
            } catch {
              toast.success("Link de pago listo");
            }
          })
        }
      >
        {url ? <Check /> : !pending && <Link2 />}
        {url ? "Link copiado" : "Link de pago"}
      </Button>
      {url && (
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
          Abrir página de pago
        </a>
      )}
    </div>
  );
}
