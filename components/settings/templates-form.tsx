"use client";

import { useTransition } from "react";
import { RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field } from "@/components/ui/field";
import { Textarea } from "@/components/ui/input";
import { applyServerErrors, useZodForm } from "@/hooks/use-zod-form";
import { updateTemplates } from "@/lib/actions/settings";
import { DEFAULT_REMINDER_TEMPLATES, REMINDER_TEMPLATE_IDS, REMINDER_TEMPLATE_LABELS, TEMPLATE_VARIABLES, type ReminderTemplateId } from "@/lib/whatsapp";
import { templatesSchema } from "@/lib/validation/schemas";

export function TemplatesForm({ templates, disabled }: { templates: Record<ReminderTemplateId, string>; disabled: boolean }) {
  const [pending, startTransition] = useTransition();
  const form = useZodForm(templatesSchema, templates);
  const { errors, isDirty } = form.formState;

  const onSubmit = form.handleSubmit(() =>
    startTransition(async () => {
      const values = form.getValues();
      const r = await updateTemplates(values);
      if (!r.ok) {
        applyServerErrors(form, r);
        toast.error(r.error);
      } else {
        toast.success(r.message);
        form.reset(values);
      }
    }),
  );

  return (
    <form onSubmit={onSubmit} noValidate className="grid gap-6">
      <div className="rounded-lg bg-muted/70 p-3 text-[13px] text-muted-foreground">
        <p className="font-medium text-foreground">Variables disponibles</p>
        <ul className="mt-1.5 flex flex-wrap gap-1.5">
          {TEMPLATE_VARIABLES.map((v) => (
            <li key={v.key} className="rounded-md bg-card px-2 py-0.5 ring-1 ring-border">
              <code className="text-foreground">{`{{${v.key}}}`}</code> {v.label}
            </li>
          ))}
        </ul>
      </div>
      <fieldset disabled={disabled} className="grid gap-5 lg:grid-cols-2">
        {REMINDER_TEMPLATE_IDS.map((id) => (
          <div key={id} className="grid gap-1.5">
            <Field id={`t-${id}`} label={REMINDER_TEMPLATE_LABELS[id].title} error={errors[id]?.message} hint={REMINDER_TEMPLATE_LABELS[id].hint}>
              <Textarea rows={9} className="font-mono text-[13px]" {...form.register(id)} />
            </Field>
            {!disabled && (
              <button
                type="button"
                className="inline-flex w-fit items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                onClick={() => form.setValue(id, DEFAULT_REMINDER_TEMPLATES[id], { shouldDirty: true })}
              >
                <RotateCcw className="size-3" aria-hidden /> Restaurar texto sugerido
              </button>
            )}
          </div>
        ))}
      </fieldset>
      {!disabled && (
        <div className="flex justify-end">
          <Button type="submit" loading={pending} disabled={!isDirty}>
            Guardar plantillas
          </Button>
        </div>
      )}
    </form>
  );
}
