"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { meetingSchema, type MeetingInput } from "@/lib/meetings/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true; id?: string }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function normalize(input: MeetingInput, ownerId: string) {
  return {
    title: input.title.trim(),
    description: emptyToNull(input.description),
    starts_at: new Date(input.starts_at).toISOString(),
    ends_at: new Date(input.ends_at).toISOString(),
    location: emptyToNull(input.location),
    attendees: emptyToNull(input.attendees),
    pipeline_deal_id: emptyToNull(input.pipeline_deal_id),
    client_id: emptyToNull(input.client_id),
    notes: emptyToNull(input.notes),
    owner_id: ownerId,
  };
}

export async function addMeeting(input: MeetingInput): Promise<ActionResult> {
  const parsed = meetingSchema.safeParse(input);
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

  const { data, error } = await supabase
    .from("meetings")
    .insert(normalize(parsed.data, user.id))
    .select("id")
    .single();

  if (error) return { ok: false, message: error.message };

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true, id: data.id };
}

export async function updateMeeting(
  id: string,
  input: MeetingInput,
): Promise<ActionResult> {
  const parsed = meetingSchema.safeParse(input);
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

  // Don't change owner_id on update — RLS uses it for ownership checks.
  const { error } = await supabase
    .from("meetings")
    .update({
      title: parsed.data.title.trim(),
      description: emptyToNull(parsed.data.description),
      starts_at: new Date(parsed.data.starts_at).toISOString(),
      ends_at: new Date(parsed.data.ends_at).toISOString(),
      location: emptyToNull(parsed.data.location),
      attendees: emptyToNull(parsed.data.attendees),
      pipeline_deal_id: emptyToNull(parsed.data.pipeline_deal_id),
      client_id: emptyToNull(parsed.data.client_id),
      notes: emptyToNull(parsed.data.notes),
    })
    .eq("id", id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/calendar");
  revalidatePath("/");
  return { ok: true };
}

export async function deleteMeeting(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.from("meetings").delete().eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/calendar");
  return { ok: true };
}
