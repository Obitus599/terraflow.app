import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

// TEMPORARY DIAGNOSTIC: wraps the data-fetch + render in try/catch and
// surfaces the actual error string inline. Errors in the layout escape
// (authed)/error.tsx (per Next docs — error boundaries don't catch errors
// in their own segment's layout) and only get caught by global-error.tsx,
// which strips the message in production. This makes them visible.
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
    // redirect() throws a NEXT_REDIRECT error that we MUST re-throw —
    // catching it here would break the redirect.
    if (
      e &&
      typeof e === "object" &&
      "digest" in e &&
      typeof (e as { digest: unknown }).digest === "string" &&
      ((e as { digest: string }).digest.startsWith("NEXT_REDIRECT") ||
        (e as { digest: string }).digest.startsWith("NEXT_NOT_FOUND"))
    ) {
      throw e;
    }

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
