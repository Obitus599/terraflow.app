import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { RealtimeRefresher } from "@/components/realtime-refresher";
import { createClient } from "@/lib/supabase/server";

// Authed routes are inherently dynamic — they read cookies for the session.
export const dynamic = "force-dynamic";

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

interface FetchedProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
}

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let profile: FetchedProfile;
  let dataFetchError: { message: string; stack: string } | null = null;

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

    const { data: fetched, error: profileError } = await supabase
      .from("profiles")
      .select("id, email, full_name, role")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      throw new Error(`profile fetch failed: ${profileError.message}`);
    }

    if (!fetched) {
      redirect("/login?error=missing_profile");
    }

    profile = fetched;
  } catch (e) {
    if (isNextInternalError(e)) throw e;

    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? (e.stack ?? "(no stack)") : "(no stack)";
    console.error("[authed-layout]", message, stack);
    dataFetchError = { message, stack };
  }

  if (dataFetchError) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
        <div className="w-full max-w-2xl rounded-xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-danger">
            Layout error · diagnostic mode
          </p>
          <h1 className="mt-2 font-display text-xl font-medium text-text">
            (authed)/layout.tsx data fetch threw
          </h1>
          <p className="mt-3 text-sm text-text-2">
            <strong className="text-text">Error:</strong>{" "}
            <code className="text-danger">{dataFetchError.message}</code>
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-bg-2 p-3 text-xs text-text-3">
            {dataFetchError.stack}
          </pre>
        </div>
      </main>
    );
  }

  return (
    <>
      <RealtimeRefresher />
      <AppShell profile={profile!}>{children}</AppShell>
    </>
  );
}
