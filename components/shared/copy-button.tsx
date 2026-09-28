"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";

export function CopyButton({ value, label = "Copiar", successMessage = "Copiado", ...props }: ButtonProps & { value: string; label?: string; successMessage?: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Button
      type="button"
      variant="secondary"
      size="sm"
      {...props}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          toast.success(successMessage);
          setTimeout(() => setCopied(false), 1500);
        } catch {
          toast.error("No se pudo copiar. Copia el texto manualmente.");
        }
      }}
    >
      {copied ? <Check /> : <Copy />}
      {label}
    </Button>
  );
}
