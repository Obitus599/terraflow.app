"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import {
  TASK_STATUSES,
  taskSchema,
  type TaskInput,
} from "@/lib/tasks/schema";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalize(input: TaskInput) {
  return {
    title: input.title.trim(),
    owner_id: input.owner_id,
    client_id: emptyToNull(input.client_id),
    status: input.status,
    priority: input.priority,
    due_date: emptyToNull(input.due_date),
    estimated_hours: input.estimated_hours,
    actual_hours: input.actual_hours,
    notes: emptyToNull(input.notes),
    category: emptyToNull(input.category),
  };
}

export async function addTask(input: TaskInput): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
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
  const { data, error } = await supabase
    .from("tasks")
    .insert(normalize(parsed.data))
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath("/tasks");
  redirect(`/tasks?highlight=${data.id}`);
}

export async function updateTask(
  id: string,
  input: TaskInput,
): Promise<ActionResult> {
  const parsed = taskSchema.safeParse(input);
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
    .from("tasks")
    .update(normalize(parsed.data))
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

const statusOnlySchema = z.object({
  id: z.string().min(1),
  status: z.enum(TASK_STATUSES),
});

export async function updateTaskStatus(
  id: string,
  status: (typeof TASK_STATUSES)[number],
): Promise<ActionResult> {
  const parsed = statusOnlySchema.safeParse({ id, status });
  if (!parsed.success) {
    return { ok: false, message: "Invalid status" };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("tasks")
    .update({ status: parsed.data.status })
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/tasks");
  return { ok: true };
}

export async function deleteTask(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("tasks").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/tasks");
  redirect("/tasks");
}
