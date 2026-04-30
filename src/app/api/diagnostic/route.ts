import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";

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
  // EVERYTHING wrapped — even synchronous throws and module-init errors
  // surface as JSON instead of an empty 500.
  try {
    // Build the client OUTSIDE step() so we never put the actual SupabaseClient
    // object into the response — it contains circular references (mfa.webauthn.
    // client) that crash JSON.stringify.
    let client: Awaited<ReturnType<typeof createClient>>;
    const createClientStep = await step<true>(async () => {
      client = await createClient();
      return true;
    });

    if (!createClientStep.ok) {
      return NextResponse.json(
        { stage: "createClient", ...createClientStep },
        { status: 500 },
      );
    }

    const auth = await step(async () => {
      const { data, error } = await client!.auth.getUser();
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
      const { data, error } = await client!
        .from("profiles")
        .select("id, email, full_name, role, monthly_capacity_hours")
        .eq("id", userId)
        .maybeSingle();
      if (error) throw error;
      return data ?? { found: false };
    });

    const counts = await step(async () => {
      const tableNames = [
        "clients",
        "tasks",
        "pipeline_deals",
        "revenue_entries",
        "cash_flow_entries",
        "cold_email_entries",
        "bank_balance",
        "app_settings",
        "profiles",
      ] as const;

      const results: Record<string, number | string> = {};
      for (const name of tableNames) {
        try {
          const { count, error } = await client!
            .from(name)
            .select("id", { count: "exact", head: true });
          results[name] = error ? `error: ${error.message}` : (count ?? -1);
        } catch (e) {
          results[name] = `throw: ${e instanceof Error ? e.message : String(e)}`;
        }
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
          createClient: createClientStep,
          auth,
          profile,
          counts,
        },
      },
      { status: 200 },
    );
  } catch (e) {
    // Last-resort catch — any synchronous throw or unhandled rejection
    // that escaped the step() wrappers ends up here as plain JSON.
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? e.stack : undefined;
    return NextResponse.json(
      {
        stage: "topLevel",
        ok: false,
        error: message,
        stack,
        now: new Date().toISOString(),
      },
      { status: 500 },
    );
  }
}
