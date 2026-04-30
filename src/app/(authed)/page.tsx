import { createClient } from "@/lib/supabase/server";

import { AdminDashboard } from "./_components/admin-dashboard";
import { TeamDashboard } from "./_components/team-dashboard";

// Bisect mode: ?bare=1 returns minimal hello-world to verify the layout
// renders. ?bare=2 returns hello + a pipe to TeamDashboard data fetch but
// no React tree from it. Default = full dashboard.
export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ bare?: string }>;
}) {
  const params = await searchParams;
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

  if (params.bare === "1") {
    return (
      <main className="flex-1 px-6 py-8">
        <h1 className="font-display text-3xl text-text">
          Bare-mode hello, {firstName}
        </h1>
        <p className="mt-2 text-text-3">
          Role: {profile?.role ?? "none"} · this page intentionally renders
          no dashboards. If you see this, the (authed) layout + shell work
          and the bug is in the dashboard components.
        </p>
      </main>
    );
  }

  if (profile?.role === "admin") {
    return <AdminDashboard firstName={firstName} />;
  }

  return <TeamDashboard firstName={firstName} userId={user!.id} />;
}
