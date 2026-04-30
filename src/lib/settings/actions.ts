"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import {
  appSettingsSchema,
  type AppSettingsInput,
  profileUpdateSchema,
  type ProfileUpdateInput,
  teamMemberSchema,
  type TeamMemberInput,
} from "@/lib/settings/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function flatErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

export async function updateAppSettings(
  input: AppSettingsInput,
): Promise<ActionResult> {
  const parsed = appSettingsSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: flatErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("app_settings")
    .select("id")
    .limit(1)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("app_settings")
      .update(parsed.data)
      .eq("id", existing.id);
    if (error) return { ok: false, message: error.message };
  } else {
    const { error } = await supabase.from("app_settings").insert(parsed.data);
    if (error) return { ok: false, message: error.message };
  }

  revalidatePath("/settings");
  revalidatePath("/");
  return { ok: true };
}

export async function updateTeamMember(
  input: TeamMemberInput,
): Promise<ActionResult> {
  const parsed = teamMemberSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: "Please fix the highlighted fields.",
      fieldErrors: flatErrors(parsed.error),
    };
  }

  const supabase = await createClient();
  const { id, ...rest } = parsed.data;
  const { error } = await supabase.from("profiles").update(rest).eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/settings");
  revalidatePath("/team");
  return { ok: true };
}

export async function updateMyProfile(
  input: ProfileUpdateInput,
): Promise<ActionResult> {
  const parsed = profileUpdateSchema.safeParse(input);
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

  const trimmedAvatar = parsed.data.avatar_url?.trim();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.full_name.trim(),
      avatar_url: trimmedAvatar && trimmedAvatar.length > 0 ? trimmedAvatar : null,
    })
    .eq("id", user.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/profile");
  revalidatePath("/");
  return { ok: true };
}

const passwordSchema = z
  .string()
  .min(8, "At least 8 characters")
  .max(72, "Too long");

export async function updateMyPassword(
  newPassword: string,
): Promise<ActionResult> {
  const parsed = passwordSchema.safeParse(newPassword);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Invalid password",
    };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({ password: parsed.data });
  if (error) return { ok: false, message: error.message };

  return { ok: true };
}
