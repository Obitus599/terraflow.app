"use server";

import { revalidatePath } from "next/cache";

import {
  ApolloError,
  fetchEmailAccounts,
  fetchEmailerCampaigns,
} from "@/lib/apollo/client";
import { createClient } from "@/lib/supabase/server";

export type SyncResult =
  | { ok: true; sequences: number; mailboxes: number }
  | { ok: false; message: string };

/**
 * Pulls the live sequence + mailbox snapshot from Apollo, upserts to
 * apollo_sequences and apollo_email_accounts. Admin-only at the RLS layer
 * (write_admin policies on both tables); the server-side createClient
 * uses the caller's session, so RLS still applies — non-admin invocations
 * will quietly write nothing. We surface that as an error to the user.
 */
export async function syncApollo(): Promise<SyncResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { ok: false, message: "Not authenticated" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return { ok: false, message: "Admin only" };
  }

  try {
    const [sequences, mailboxes] = await Promise.all([
      fetchEmailerCampaigns(),
      fetchEmailAccounts(),
    ]);

    const now = new Date().toISOString();

    const seqRows = sequences.map((s) => ({
      id: s.id,
      name: s.name,
      active: s.active,
      archived: s.archived,
      num_steps: s.num_steps,
      unique_scheduled: s.unique_scheduled ?? 0,
      unique_delivered: s.unique_delivered ?? 0,
      unique_bounced: s.unique_bounced ?? 0,
      unique_hard_bounced: s.unique_hard_bounced ?? 0,
      unique_opened: s.unique_opened ?? 0,
      unique_replied: s.unique_replied ?? 0,
      unique_clicked: s.unique_clicked ?? 0,
      unique_spam_blocked: s.unique_spam_blocked ?? 0,
      unique_unsubscribed: s.unique_unsubscribed ?? 0,
      open_rate: s.open_rate ?? 0,
      bounce_rate: s.bounce_rate ?? 0,
      reply_rate: s.reply_rate ?? 0,
      click_rate: s.click_rate ?? 0,
      spam_block_rate: s.spam_block_rate ?? 0,
      is_performing_poorly: s.is_performing_poorly ?? false,
      creation_type: s.creation_type,
      created_at_apollo: s.created_at,
      last_used_at: s.last_used_at,
      synced_at: now,
    }));

    const mboxRows = mailboxes.map((m) => ({
      id: m.id,
      email: m.email,
      provider: m.type,
      active: m.active,
      is_default: m.default,
      created_at_apollo: m.created_at,
      last_synced_at_apollo: m.last_synced_at,
      synced_at: now,
    }));

    const { error: seqError } = await supabase
      .from("apollo_sequences")
      .upsert(seqRows, { onConflict: "id" });
    if (seqError) return { ok: false, message: `sequences: ${seqError.message}` };

    const { error: mboxError } = await supabase
      .from("apollo_email_accounts")
      .upsert(mboxRows, { onConflict: "id" });
    if (mboxError) return { ok: false, message: `mailboxes: ${mboxError.message}` };

    revalidatePath("/cold-email");
    revalidatePath("/");

    return { ok: true, sequences: seqRows.length, mailboxes: mboxRows.length };
  } catch (e) {
    if (e instanceof ApolloError) {
      return { ok: false, message: e.message };
    }
    return {
      ok: false,
      message: e instanceof Error ? e.message : String(e),
    };
  }
}
