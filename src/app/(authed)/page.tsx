import { createClient } from "@/lib/supabase/server";

import { AdminDashboard } from "./_components/admin-dashboard";
import { TeamDashboard } from "./_components/team-dashboard";

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

  if (profile?.role === "admin") {
    return <AdminDashboard firstName={firstName} />;
  }

  return <TeamDashboard firstName={firstName} userId={user!.id} />;
}
