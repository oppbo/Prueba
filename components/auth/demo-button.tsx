"use client";

import { useTransition } from "react";
import { Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, type ButtonProps } from "@/components/ui/button";
import { signInDemo } from "@/lib/actions/auth";

export function DemoButton({ children = "Entrar a la demo", ...props }: ButtonProps) {
  const [pending, startTransition] = useTransition();
  return (
    <Button
      type="button"
      variant="secondary"
      size="lg"
      className="w-full"
      loading={pending}
      onClick={() =>
        startTransition(async () => {
          const result = await signInDemo();
          if (result && !result.ok) toast.error(result.error);
        })
      }
      {...props}
    >
      {!pending && <Sparkles />}
      {children}
    </Button>
  );
}
