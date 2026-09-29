"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, PlayCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";

/** Demo login: validates the form, then enters the demo (no real authentication). */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("marcelo@illimani.bo");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);

  const enter = () => {
    setLoading(true);
    router.push("/dashboard");
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Ingresa un correo válido.";
    if (password.length < 4) next.password = "Ingresa tu contraseña.";
    setErrors(next);
    if (Object.keys(next).length === 0) enter();
  };

  return (
    <>
      <form onSubmit={submit} noValidate className="mt-8 space-y-4">
        <Field id="email" label="Correo" error={errors.email}>
          <Input type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="h-10" />
        </Field>
        <Field id="password" label="Contraseña" error={errors.password}>
          <Input type="password" autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="h-10" />
        </Field>
        <Button type="submit" size="lg" className="w-full" loading={loading}>
          Ingresar <ArrowRight />
        </Button>
      </form>
      <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />o<span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="secondary" size="lg" className="w-full" onClick={enter}>
        <PlayCircle className="text-primary" /> Entrar a la demo
      </Button>
      <p className="mt-6 text-center text-xs text-muted-foreground">Demo con datos ficticios de Distribuidora Illimani.</p>
    </>
  );
}
