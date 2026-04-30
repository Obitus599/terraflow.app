import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role")
    .eq("id", user!.id)
    .maybeSingle();

  const firstName = profile?.full_name?.split(" ")[0] ?? "there";
  const isAdmin = profile?.role === "admin";

  return (
    <main className="flex-1 px-6 py-10 md:px-10 md:py-12">
      <p className="section-label mb-6">{isAdmin ? "Admin · home" : "Today"}</p>

      <h1 className="font-display text-3xl font-medium tracking-tight text-text md:text-4xl">
        Welcome, <span className="text-accent">{firstName}</span>
      </h1>
      <p className="mt-3 max-w-xl text-text-2">
        The dashboard, tasks, pipeline, revenue, and cash-flow surfaces ship
        across the next few iterations. Foundation is wired: auth, schema, RLS,
        audit log, brand system.
      </p>

      <div className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Role" value={profile?.role ?? "—"} />
        <Stat label="Tables" value="10" />
        <Stat label="RLS policies" value="22" />
        <Stat label="Audit triggers" value="6" />
      </div>
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
