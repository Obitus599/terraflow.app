"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  bankBalanceSchema,
  cashFlowSchema,
  type BankBalanceInput,
  type CashFlowInput,
} from "@/lib/cashflow/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalizeFlow(input: CashFlowInput) {
  return {
    entry_date: input.entry_date,
    direction: input.direction,
    category: input.category,
    description: emptyToNull(input.description),
    amount_aed: input.amount_aed,
    notes: emptyToNull(input.notes),
  };
}

export async function addCashEntry(input: CashFlowInput): Promise<ActionResult> {
  const parsed = cashFlowSchema.safeParse(input);
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
    .from("cash_flow_entries")
    .insert(normalizeFlow(parsed.data));
  if (error) return { ok: false, message: error.message };

  revalidatePath("/cash-flow");
  redirect("/cash-flow");
}

export async function deleteCashEntry(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cash_flow_entries")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/cash-flow");
  return { ok: true };
}

export async function updateBankBalance(
  input: BankBalanceInput,
): Promise<ActionResult> {
  const parsed = bankBalanceSchema.safeParse(input);
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
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  // bank_balance is a singleton — upsert the latest row, replace if exists.
  const { data: existing } = await supabase
    .from("bank_balance")
    .select("id")
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("bank_balance")
      .update({
        current_aed: parsed.data.current_aed,
        last_updated_by: user.id,
      })
      .eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("bank_balance").insert({
      current_aed: parsed.data.current_aed,
      last_updated_by: user.id,
    });
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/cash-flow");
  revalidatePath("/");
  return { ok: true };
}
