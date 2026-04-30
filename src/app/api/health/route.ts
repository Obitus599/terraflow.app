import { NextResponse } from "next/server";

/**
 * Sanity-check endpoint, deliberately bypassed by the auth proxy
 * (see matcher in src/proxy.ts). Returns a small JSON document with
 * env-var presence indicators so a deployment can be verified without
 * needing to log in.
 *
 * - Reports presence (`set` / `MISSING`), never values.
 * - Includes commit SHA when available (Vercel sets VERCEL_GIT_COMMIT_SHA).
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export function GET() {
  const supabaseUrlSet = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKeySet = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleSet = !!process.env.SUPABASE_SERVICE_ROLE_KEY;

  const ok = supabaseUrlSet && anonKeySet;

  return NextResponse.json(
    {
      status: ok ? "ok" : "misconfigured",
      now: new Date().toISOString(),
      env: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrlSet ? "set" : "MISSING",
        NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKeySet ? "set" : "MISSING",
        SUPABASE_SERVICE_ROLE_KEY: serviceRoleSet ? "set" : "MISSING (optional)",
      },
      git: {
        sha: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? "unknown",
        ref: process.env.VERCEL_GIT_COMMIT_REF ?? "unknown",
      },
      runtime: {
        node: process.version,
        region: process.env.VERCEL_REGION ?? "unknown",
      },
    },
    { status: ok ? 200 : 500 },
  );
}
