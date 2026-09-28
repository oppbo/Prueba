"use client";

import { useState, useTransition } from "react";
import { useZodForm } from "@/hooks/use-zod-form";
import { MailCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { signUp } from "@/lib/actions/auth";
import { signupSchema } from "@/lib/validation/schemas";

export function SignupForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const form = useZodForm(signupSchema, { fullName: "", organizationName: "", email: "", password: "" });
  const { errors } = form.formState;

  const onSubmit = form.handleSubmit(() => {
    const values = form.getValues();
    setError(null);
    startTransition(async () => {
      const result = await signUp(values);
      if (!result) return;
      if (!result.ok) setError(result.error);
      else if (result.data.needsConfirmation) setSentTo(values.email);
    });
  });

  if (sentTo) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center shadow-xs" role="status">
        <MailCheck className="mx-auto size-8 text-primary" aria-hidden />
        <p className="mt-3 font-medium">Revisa tu correo</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Enviamos un enlace de confirmación a <strong className="text-foreground">{sentTo}</strong>. Ábrelo para activar tu cuenta.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4" noValidate>
      <Field id="fullName" label="Tu nombre" error={errors.fullName?.message}>
        <Input autoComplete="name" placeholder="María Quispe" {...form.register("fullName")} />
      </Field>
      <Field id="organizationName" label="Nombre de tu empresa" error={errors.organizationName?.message}>
        <Input autoComplete="organization" placeholder="Distribuidora Andina SRL" {...form.register("organizationName")} />
      </Field>
      <Field id="email" label="Correo electrónico" error={errors.email?.message}>
        <Input type="email" autoComplete="email" inputMode="email" placeholder="tu@empresa.com" {...form.register("email")} />
      </Field>
      <Field id="password" label="Contraseña" error={errors.password?.message} hint="Mínimo 8 caracteres.">
        <Input type="password" autoComplete="new-password" {...form.register("password")} />
      </Field>
      {error && (
        <p role="alert" className="rounded-lg border border-destructive/20 bg-destructive-soft px-3 py-2 text-sm text-destructive-soft-foreground">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" loading={pending} className="mt-1 w-full">
        Crear cuenta
      </Button>
      <p className="text-center text-xs text-muted-foreground">Sin tarjeta de crédito. Tus datos solo los ve tu empresa.</p>
    </form>
  );
}
