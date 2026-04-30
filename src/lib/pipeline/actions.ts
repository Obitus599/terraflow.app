"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  PIPELINE_STAGES,
  dealSchema,
  type DealInput,
} from "@/lib/pipeline/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalize(input: DealInput) {
  return {
    prospect_name: input.prospect_name.trim(),
    company: emptyToNull(input.company),
    source: input.source,
    stage: input.stage,
    confidence: input.confidence,
    expected_aed_monthly: input.expected_aed_monthly,
    expected_aed_one_time: input.expected_aed_one_time,
    expected_close_month: emptyToNull(input.expected_close_month),
    last_touch: emptyToNull(input.last_touch),
    next_action: emptyToNull(input.next_action),
    owner_id: emptyToNull(input.owner_id),
    notes: emptyToNull(input.notes),
    won_lost_reason: emptyToNull(input.won_lost_reason),
  };
}

export async function addDeal(input: DealInput): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input);
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
    .from("pipeline_deals")
    .insert(normalize(parsed.data));

  if (error) return { ok: false, message: error.message };

  revalidatePath("/pipeline");
  redirect("/pipeline");
}

export async function updateDeal(
  id: string,
  input: DealInput,
): Promise<ActionResult> {
  const parsed = dealSchema.safeParse(input);
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
    .from("pipeline_deals")
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/pipeline");
  return { ok: true };
}

const stageOnlySchema = z.object({
  id: z.string().min(1),
  stage: z.enum(PIPELINE_STAGES),
});

export async function updateDealStage(
  id: string,
  stage: (typeof PIPELINE_STAGES)[number],
): Promise<ActionResult> {
  const parsed = stageOnlySchema.safeParse({ id, stage });
  if (!parsed.success) return { ok: false, message: "Invalid stage" };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pipeline_deals")
    .update({ stage: parsed.data.stage })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/pipeline");
  return { ok: true };
}

export async function deleteDeal(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("pipeline_deals")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/pipeline");
  redirect("/pipeline");
}
