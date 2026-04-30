"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import {
  COLD_EMAIL_FLAGS,
  type ColdEmailFlag,
  coldEmailSchema,
  type ColdEmailInput,
} from "@/lib/cold-email/schema";
import { createClient } from "@/lib/supabase/server";

export type ActionResult =
  | { ok: true }
  | { ok: false; message: string; fieldErrors?: Record<string, string[]> };

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

export async function addProspect(input: ColdEmailInput): Promise<ActionResult> {
  const parsed = coldEmailSchema.safeParse(input);
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
  const { error } = await supabase.from("cold_email_entries").insert({
    prospect_name: parsed.data.prospect_name.trim(),
    company: emptyToNull(parsed.data.company),
    email: parsed.data.email.trim().toLowerCase(),
    subject: emptyToNull(parsed.data.subject),
    notes: emptyToNull(parsed.data.notes),
  });

  if (error) return { ok: false, message: error.message };

  revalidatePath("/cold-email");
  redirect("/cold-email");
}

const flagSchema = z.object({
  id: z.string().min(1),
  flag: z.enum(COLD_EMAIL_FLAGS),
  value: z.boolean(),
});

export async function updateProspectFlag(
  id: string,
  flag: ColdEmailFlag,
  value: boolean,
): Promise<ActionResult> {
  const parsed = flagSchema.safeParse({ id, flag, value });
  if (!parsed.success) return { ok: false, message: "Invalid input" };

  const supabase = await createClient();

  // When marking `sent` true, also stamp sent_date if it isn't already set.
  // Same trick as adding the date when ticking the box, blanking it on untick.
  // When marking `sent` true, also stamp sent_date; blank it on untick.
  // Use the explicit Update shape so PostgREST's typed query builder
  // accepts the dynamic-key construction.
  type Update = {
    sent?: boolean;
    opened?: boolean;
    replied?: boolean;
    bounced?: boolean;
    booked_call?: boolean;
    sent_date?: string | null;
  };
  const update: Update = { [parsed.data.flag]: parsed.data.value };
  if (parsed.data.flag === "sent") {
    update.sent_date = parsed.data.value
      ? new Date().toISOString().slice(0, 10)
      : null;
  }

  const { error } = await supabase
    .from("cold_email_entries")
    .update(update)
    .eq("id", parsed.data.id);

  if (error) return { ok: false, message: error.message };

  revalidatePath("/cold-email");
  return { ok: true };
}

export async function deleteProspect(id: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase
    .from("cold_email_entries")
    .delete()
    .eq("id", id);
  if (error) return { ok: false, message: error.message };

  revalidatePath("/cold-email");
  return { ok: true };
}
