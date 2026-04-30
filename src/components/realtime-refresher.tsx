"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { createClient } from "@/lib/supabase/client";

const REALTIME_TABLES = [
  "tasks",
  "pipeline_deals",
  "revenue_entries",
  "cash_flow_entries",
  "cold_email_entries",
  "clients",
  "bank_balance",
  "meetings",
  "apollo_sequences",
  "apollo_email_accounts",
] as const;

/**
 * Subscribes to Postgres change events on the tables the app reads, and
 * calls router.refresh() whenever something changes. Re-running server
 * components is heavier than invalidating a single TanStack Query, but the
 * dataset is tiny (5 users, dozens of rows) and the simplicity is worth
 * more than the optimization.
 *
 * Placed in (authed)/layout so every signed-in page gets live updates.
 * Subscriptions tear down on unmount via the cleanup return.
 */
export function RealtimeRefresher() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    const channel = supabase.channel("terraflow-app");

    for (const table of REALTIME_TABLES) {
      channel.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        () => {
          router.refresh();
        },
      );
    }

    channel.subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [router]);

  return null;
}
