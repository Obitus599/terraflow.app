"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { revenueSchema, type RevenueInput } from "@/lib/revenue/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalize(input: RevenueInput) {
  return {
    received_date: input.received_date,
    client_id: emptyToNull(input.client_id),
    invoice_number: emptyToNull(input.invoice_number),
    amount_aed: input.amount_aed,
    entry_type: input.entry_type,
    notes: emptyToNull(input.notes),
  };
}

export async function addRevenue(input: RevenueInput): Promise<ActionResult> {
  const parsed = revenueSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: z.flattenError(parsed.error).fieldErrors as Record<
        string,
        string[]
      >,
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("revenue_entries")
    .insert(normalize(parsed.data));

  if (error) return { ok: false, message: error.message };

  revalidatePath("/revenue");
  redirect("/revenue");
}

export async function deleteRevenue(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("revenue_entries")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/revenue");
  return { ok: true };
}
