"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { clientSchema, type ClientInput } from "@/lib/clients/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalize(input: ClientInput) {
  return {
    name: input.name.trim(),
    client_type: input.client_type,
    monthly_aed: input.monthly_aed,
    status: input.status,
    health: input.health,
    start_date: emptyToNull(input.start_date),
    upsell_ideas: emptyToNull(input.upsell_ideas),
    notes: emptyToNull(input.notes),
  };
}

export async function addClient(input: ClientInput): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("clients")
    .insert(normalize(parsed.data))
    .select("id")
    .single();

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/clients");
  redirect(`/clients/${data.id}`);
}

export async function updateClient(
  id: string,
  input: ClientInput,
): Promise<ActionResult> {
  const parsed = clientSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<string, string[]>,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("clients")
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) {
    return { ok: false, message: error.message };
  }

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);
  return { ok: true };
}

export async function deleteClient(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("clients").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/clients");
  redirect("/clients");
}
