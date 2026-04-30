import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth/actions";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should already redirect, but defensive belt+braces.
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";

  return (
    <main className="min-h-screen bg-bg">
      <header className="flex items-center justify-between border-b border-line px-6 py-4">
        <div className="flex items-center gap-2">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent font-display text-sm font-semibold text-bg">
            T
          </span>
          <span className="font-display text-sm font-medium tracking-tight text-text">
            TerraFlow Ops
          </span>
        </div>
        <form action={signOut}>
          <Button variant="ghost" size="sm" type="submit">
            <LogOut className="mr-2 h-3.5 w-3.5" />
            Sign out
          </Button>
        </form>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-16">
        <p className="section-label mb-6">Phase 1 · scaffold</p>
        <h1 className="font-display text-4xl font-medium tracking-tight text-text">
          Welcome, <span className="text-accent">{firstName}</span>
        </h1>
        <p className="mt-3 max-w-xl text-text-2">
          Auth, schema, RLS, and the brand system are wired. The dashboard,
          tasks, pipeline, revenue, and cash-flow surfaces ship next.
        </p>

        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Stat label="Role" value={profile?.role ?? "—"} />
          <Stat label="Tables" value="10" />
          <Stat label="RLS policies" value="22" />
          <Stat label="Audit triggers" value="6" />
        </div>
      </section>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-bg-2 p-4">
      <p className="text-xs uppercase tracking-[0.18em] text-text-3">{label}</p>
      <p className="mt-2 font-display text-xl text-text">{value}</p>
    </div>
  );
}
