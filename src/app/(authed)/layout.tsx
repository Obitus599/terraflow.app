import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

// Authed routes are inherently dynamic — they read cookies for the
// session — so opt out of any prerender attempt up-front. Belt-and-braces:
// even though the layout uses cookies() (which already makes the route
// dynamic), this prevents Next 16 from logging DynamicServerError during
// the static-analysis pass.
export const dynamic = "force-dynamic";

// Errors thrown during a layout's render escape its segment's error.tsx
// and only get caught by global-error.tsx — which strips the message in
// production. We wrap data-fetching here so we can render a useful error
// inline instead of the generic "Application error" screen.
//
// CRITICAL: redirect(), notFound(), and Next's DynamicServerError signals
// are control flow, not actual errors. They MUST be re-thrown or the
// framework breaks (redirects don't fire, dynamic routes get baked into
// stale prerenders, etc.).
const NEXT_INTERNAL_DIGESTS = [
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  "NEXT_HTTP_ERROR_FALLBACK",
  "DYNAMIC_SERVER_USAGE",
];

function isNextInternalError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const digest = (e as { digest?: unknown }).digest;
  if (typeof digest !== "string") return false;
  return NEXT_INTERNAL_DIGESTS.some((prefix) => digest.startsWith(prefix));
}

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser();

    if (getUserError) {
      throw new Error(`auth.getUser failed: ${getUserError.message}`);
    }

    if (!user) {
      redirect("/login");
    }

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`profile fetch failed: ${profileError.message}`);
    }

    if (!profile) {
      redirect("/login?error=missing_profile");
    }

    return <AppShell profile={profile}>{children}</AppShell>;
  } catch (e) {
    if (isNextInternalError(e)) throw e;

    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? (e.stack ?? "(no stack)") : "(no stack)";

    console.error("[authed-layout]", message, stack);

    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
        <div className="w-full max-w-2xl rounded-xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-danger">
            Layout error · diagnostic mode
          </p>
          <h1 className="mt-2 font-display text-xl font-medium text-text">
            (authed)/layout.tsx threw
          </h1>
          <p className="mt-3 text-sm text-text-2">
            <strong className="text-text">Error:</strong>{" "}
            <code className="text-danger">{message}</code>
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-bg-2 p-3 text-xs text-text-3">
            {stack}
          </pre>
        </div>
      </main>
    );
  }
}
