"use client";

import { useForm, type DefaultValues, type Path, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import type { ActionResult } from "@/lib/actions/result";

/**
 * React Hook Form bound to a Zod schema. Forms keep raw string inputs; the
 * server action re-validates the same raw values with the same schema, so
 * client validation is only a UX layer, never the source of truth.
 */
export function useZodForm<S extends z.ZodType<unknown, Record<string, unknown>>>(schema: S, defaultValues: DefaultValues<z.input<S>>) {
  return useForm<z.input<S>, unknown, z.output<S>>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema as any) as any,
    defaultValues,
    mode: "onTouched",
  });
}

/** Copies server-side field errors back into the form. */
export function applyServerErrors<T extends Record<string, unknown>>(form: UseFormReturn<T, unknown, unknown>, result: ActionResult<unknown>) {
  if (result.ok || !result.fieldErrors) return;
  for (const [key, message] of Object.entries(result.fieldErrors)) {
    form.setError(key as Path<T>, { message });
  }
}
