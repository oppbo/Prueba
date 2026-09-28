"use client";

import { useState, useTransition } from "react";
import { useZodForm } from "@/hooks/use-zod-form";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signIn } from "@/lib/actions/auth";
import { loginSchema } from "@/lib/validation/schemas";

export function LoginForm({ next }: { next?: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const form = useZodForm(loginSchema, { email: "", password: "" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await signIn(values, next);
      if (result && !result.ok) setError(result.error);
    });
  });

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field id="email" label="Correo electrónico" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" placeholder="tu@empresa.com" {...form.register("email")} />
      </Field>
      <Field id="password" label="Contraseña" error={errors.password?.message}>
        <Input type="password" autoComplete="current-password" {...form.register("password")} />
      </Field>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        Iniciar sesión
      </Button>
    </form>
  );
}
