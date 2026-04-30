import { redirect } from "next/navigation";

import { AppShell } from "@/components/app-shell";
import { createClient } from "@/lib/supabase/server";

export default async function AuthedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, email, full_name, role")
    .eq("id", user.id)
    .maybeSingle();

  // Edge case: auth user exists but trigger didn't create profile (shouldn't
  // happen with our handle_new_user trigger, but belt-and-braces).
  if (!profile) {
    redirect("/login?error=missing_profile");
  }

  return <AppShell profile={profile}>{children}</AppShell>;
}
