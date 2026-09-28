"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";
import { uuid } from "@/lib/validation/common";
import { customerSchema } from "@/lib/validation/schemas";
import { dbErrorMessage, fail, fromZod, ok, type ActionResult } from "./result";

export async function createCustomer(input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("customers")
    .insert({ ...parsed.data, organization_id: session.organization.id })
    .select("id")
    .single();
  if (error || !data) return fail(dbErrorMessage(error, "No se pudo crear el cliente."));
  revalidatePath("/dashboard", "layout");
  return ok({ id: data.id }, "Cliente creado");
}

export async function updateCustomer(customerId: string, input: unknown): Promise<ActionResult<{ id: string }>> {
  const session = await requireSession();
  const id = uuid.safeParse(customerId);
  if (!id.success) return fail("Cliente no válido.");
  const parsed = customerSchema.safeParse(input);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  // organization_id filter + RLS: a forged id from another tenant matches no row.
  const { data, error } = await supabase
    .from("customers")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("organization_id", session.organization.id)
    .select("id")
    .maybeSingle();
  if (error) return fail(dbErrorMessage(error, "No se pudo actualizar el cliente."));
  if (!data) return fail("El cliente no existe o no tienes acceso.");
  revalidatePath("/dashboard", "layout");
  return ok({ id: data.id }, "Cliente actualizado");
}
