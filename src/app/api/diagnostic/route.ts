import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

/**
 * Diagnostic endpoint — reproduces every query the (authed) layout and
 * dashboard make, individually try/caught, and returns structured JSON.
 *
 * Bypasses the auth proxy (excluded in src/proxy.ts matcher) so it always
 * runs even when the React tree is throwing during render.
 *
 * Reports:
 *  - Whether we can read the auth session
 *  - Whether profile fetch returns a row
 *  - Counts from every table the dashboard queries
 *  - Any error from any step, including stack
 *
 * Hit it directly from the browser; copy + paste back to debug.
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Step =
  | { ok: true; durationMs: number; result: unknown }
  | { ok: false; durationMs: number; error: string; stack?: string };

async function step<T>(fn: () => Promise<T>): Promise<Step> {
  const t0 = Date.now();
  try {
    const result = await fn();
    return { ok: true, durationMs: Date.now() - t0, result };
  } catch (e) {
    const error = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return { ok: false, durationMs: Date.now() - t0, error, stack };
  }
}

export async function GET() {
  const supabase = await step(async () => {
    return await createClient();
  });

  if (!supabase.ok) {
    return NextResponse.json(
      { stage: "createClient", ...supabase },
      { status: 500 },
    );
  }

  const client = supabase.result as Awaited<ReturnType<typeof createClient>>;

  const auth = await step(async () => {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return {
      hasUser: !!data.user,
      userId: data.user?.id ?? null,
      email: data.user?.email ?? null,
    };
  });

  const userId =
    auth.ok && auth.result && typeof auth.result === "object"
      ? (auth.result as { userId: string | null }).userId
      : null;

  const profile = await step(async () => {
    if (!userId) return { skipped: "no userId" };
    const { data, error } = await client
      .from("profiles")
      .select("id, email, full_name, role, monthly_capacity_hours")
      .eq("id", userId)
      .maybeSingle();
    if (error) throw error;
    return data ?? { found: false };
  });

  const counts = await step(async () => {
    const queries = [
      ["clients", client.from("clients").select("id", { count: "exact", head: true })],
      ["tasks", client.from("tasks").select("id", { count: "exact", head: true })],
      [
        "pipeline_deals",
        client.from("pipeline_deals").select("id", { count: "exact", head: true }),
      ],
      [
        "revenue_entries",
        client.from("revenue_entries").select("id", { count: "exact", head: true }),
      ],
      [
        "cash_flow_entries",
        client.from("cash_flow_entries").select("id", { count: "exact", head: true }),
      ],
      [
        "cold_email_entries",
        client.from("cold_email_entries").select("id", { count: "exact", head: true }),
      ],
      [
        "bank_balance",
        client.from("bank_balance").select("id", { count: "exact", head: true }),
      ],
      [
        "app_settings",
        client.from("app_settings").select("id", { count: "exact", head: true }),
      ],
      [
        "profiles",
        client.from("profiles").select("id", { count: "exact", head: true }),
      ],
    ] as const;

    const results: Record<string, number | string> = {};
    for (const [name, q] of queries) {
      const { count, error } = await q;
      results[name] = error ? `error: ${error.message}` : (count ?? -1);
    }
    return results;
  });

  return NextResponse.json(
    {
      now: new Date().toISOString(),
      git: {
        sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
        ref: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
      },
      steps: {
        createClient: supabase,
        auth,
        profile,
        counts,
      },
    },
    { status: 200 },
  );
}
