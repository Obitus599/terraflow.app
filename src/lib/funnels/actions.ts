"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  funnelSchema,
  stageSchema,
  type FunnelInput,
  type StageInput,
} from "@/lib/funnels/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function flatErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

// --------------------------------------------------------------------
// Funnels CRUD
// --------------------------------------------------------------------

export async function createFunnel(input: FunnelInput): Promise<ActionResult> {
  const parsed = funnelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: flatErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const { data, error } = await supabase
    .from("funnels")
    .insert({
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      channel: parsed.data.channel,
      is_template: false,
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (error) return { ok: false, message: error.message };

  // Default empty funnel: seed with First touch -> Won -> Lost so the user
  // has a starting point. They can rename / add stages from the editor.
  const { error: stagesError } = await supabase.from("funnel_stages").insert([
    { funnel_id: data.id, name: "First touch", sort_order: 0 },
    {
      funnel_id: data.id,
      name: "Won",
      sort_order: 1,
      is_terminal_won: true,
    },
    {
      funnel_id: data.id,
      name: "Lost",
      sort_order: 2,
      is_terminal_lost: true,
    },
  ]);
  if (stagesError) return { ok: false, message: stagesError.message };

  revalidatePath("/funnels");
  redirect(`/funnels/${data.id}/edit`);
}

const cloneSchema = z.object({
  template_id: z.string().min(1),
  name: z.string().min(1).max(120),
});

export async function cloneTemplate(
  template_id: string,
  name: string,
): Promise<ActionResult> {
  const parsed = cloneSchema.safeParse({ template_id, name });
  if (!parsed.success) {
    return { ok: false, message: "Please give the funnel a name." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const { data: template, error: templateError } = await supabase
    .from("funnels")
    .select("id, name, description, channel, template_slug, is_template")
    .eq("id", parsed.data.template_id)
    .maybeSingle();
  if (templateError) return { ok: false, message: templateError.message };
  if (!template || !template.is_template) {
    return { ok: false, message: "Not a template" };
  }

  const { data: tStages, error: stagesQueryError } = await supabase
    .from("funnel_stages")
    .select(
      "name, sort_order, target_conversion_pct, target_days, is_terminal_won, is_terminal_lost",
    )
    .eq("funnel_id", template.id)
    .order("sort_order");
  if (stagesQueryError) return { ok: false, message: stagesQueryError.message };

  const { data: created, error: insertError } = await supabase
    .from("funnels")
    .insert({
      name: parsed.data.name.trim(),
      description: template.description,
      channel: template.channel,
      template_slug: template.template_slug,
      is_template: false,
      owner_id: user.id,
    })
    .select("id")
    .single();
  if (insertError) return { ok: false, message: insertError.message };

  if (tStages && tStages.length > 0) {
    const stageRows = tStages.map((s) => ({
      funnel_id: created.id,
      name: s.name,
      sort_order: s.sort_order,
      target_conversion_pct: s.target_conversion_pct,
      target_days: s.target_days,
      is_terminal_won: s.is_terminal_won,
      is_terminal_lost: s.is_terminal_lost,
    }));
    const { error: stagesInsertError } = await supabase
      .from("funnel_stages")
      .insert(stageRows);
    if (stagesInsertError) {
      return { ok: false, message: stagesInsertError.message };
    }
  }

  revalidatePath("/funnels");
  redirect(`/funnels/${created.id}`);
}

export async function updateFunnel(
  id: string,
  input: FunnelInput,
): Promise<ActionResult> {
  const parsed = funnelSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: flatErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("funnels")
    .update({
      name: parsed.data.name.trim(),
      description: parsed.data.description?.trim() || null,
      channel: parsed.data.channel,
    })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/funnels");
  revalidatePath(`/funnels/${id}`);
  return { ok: true };
}

export async function archiveFunnel(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("funnels")
    .update({ archived: true })
    .eq("id", id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/funnels");
  return { ok: true };
}

// --------------------------------------------------------------------
// Stages
// --------------------------------------------------------------------

export async function addStage(
  funnel_id: string,
  input: StageInput,
): Promise<ActionResult> {
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: flatErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("funnel_stages")
    .select("sort_order")
    .eq("funnel_id", funnel_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const nextOrder = (existing?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("funnel_stages").insert({
    funnel_id,
    name: parsed.data.name.trim(),
    sort_order: nextOrder,
    target_conversion_pct: parsed.data.target_conversion_pct,
    target_days: parsed.data.target_days,
    is_terminal_won: parsed.data.is_terminal_won,
    is_terminal_lost: parsed.data.is_terminal_lost,
  });
  if (error) return { ok: false, message: error.message };

  revalidatePath(`/funnels/${funnel_id}`);
  revalidatePath(`/funnels/${funnel_id}/edit`);
  return { ok: true };
}

export async function updateStage(
  stage_id: string,
  input: StageInput,
): Promise<ActionResult> {
  const parsed = stageSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: flatErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("funnel_stages")
    .update({
      name: parsed.data.name.trim(),
      target_conversion_pct: parsed.data.target_conversion_pct,
      target_days: parsed.data.target_days,
      is_terminal_won: parsed.data.is_terminal_won,
      is_terminal_lost: parsed.data.is_terminal_lost,
    })
    .eq("id", stage_id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/funnels");
  return { ok: true };
}

export async function deleteStage(stage_id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("funnel_stages")
    .delete()
    .eq("id", stage_id);
  if (error) return { ok: false, message: error.message };
  revalidatePath("/funnels");
  return { ok: true };
}

export async function reorderStages(
  funnel_id: string,
  stage_ids: string[],
): Promise<ActionResult> {
  if (!Array.isArray(stage_ids) || stage_ids.length === 0) {
    return { ok: false, message: "No stages to reorder" };
  }

  const supabase = await createClient();
  // Two-phase: bump every stage to a unique-out-of-range sort_order first
  // (the unique index prevents in-place updates that would temporarily
  // collide), then set the final ordering.
  for (let i = 0; i < stage_ids.length; i += 1) {
    const { error } = await supabase
      .from("funnel_stages")
      .update({ sort_order: 1000 + i })
      .eq("id", stage_ids[i])
      .eq("funnel_id", funnel_id);
    if (error) return { ok: false, message: error.message };
  }
  for (let i = 0; i < stage_ids.length; i += 1) {
    const { error } = await supabase
      .from("funnel_stages")
      .update({ sort_order: i })
      .eq("id", stage_ids[i])
      .eq("funnel_id", funnel_id);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath(`/funnels/${funnel_id}`);
  revalidatePath(`/funnels/${funnel_id}/edit`);
  return { ok: true };
}

// --------------------------------------------------------------------
// Runs (a prospect's journey through a funnel)
// --------------------------------------------------------------------

const moveRunSchema = z.object({
  run_id: z.string().min(1),
  to_stage_id: z.string().min(1),
});

export async function moveRunToStage(
  run_id: string,
  to_stage_id: string,
): Promise<ActionResult> {
  const parsed = moveRunSchema.safeParse({ run_id, to_stage_id });
  if (!parsed.success) return { ok: false, message: "Invalid input" };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const { data: run, error: runError } = await supabase
    .from("funnel_runs")
    .select("id, current_stage_id, funnel_id")
    .eq("id", parsed.data.run_id)
    .maybeSingle();
  if (runError) return { ok: false, message: runError.message };
  if (!run) return { ok: false, message: "Run not found" };

  const { data: stage, error: stageError } = await supabase
    .from("funnel_stages")
    .select("id, funnel_id, is_terminal_won, is_terminal_lost")
    .eq("id", parsed.data.to_stage_id)
    .maybeSingle();
  if (stageError) return { ok: false, message: stageError.message };
  if (!stage || stage.funnel_id !== run.funnel_id) {
    return { ok: false, message: "Stage doesn't belong to this funnel" };
  }

  const outcome = stage.is_terminal_won
    ? "won"
    : stage.is_terminal_lost
      ? "lost"
      : "in_progress";
  const ended_at =
    outcome === "won" || outcome === "lost" ? new Date().toISOString() : null;

  const { error: updateError } = await supabase
    .from("funnel_runs")
    .update({
      current_stage_id: stage.id,
      outcome,
      ended_at,
    })
    .eq("id", run.id);
  if (updateError) return { ok: false, message: updateError.message };

  // Audit transition (skip if same stage)
  if (run.current_stage_id !== stage.id) {
    await supabase.from("funnel_stage_transitions").insert({
      funnel_run_id: run.id,
      from_stage_id: run.current_stage_id,
      to_stage_id: stage.id,
      actor_id: user.id,
    });
  }

  revalidatePath(`/funnels/${run.funnel_id}`);
  return { ok: true };
}
