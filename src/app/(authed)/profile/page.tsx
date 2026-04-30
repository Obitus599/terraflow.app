import { PageHeader } from "@/components/page-header";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";

import { PasswordForm } from "./_components/password-form";
import { ProfileForm } from "./_components/profile-form";

export const metadata = { title: "Profile" };

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, role, avatar_url, monthly_capacity_hours, fixed_monthly_cost_aed")
    .eq("id", user!.id)
    .maybeSingle();

  return (
    <>
      <PageHeader
        eyebrow="Profile"
        title={profile?.full_name ?? "You"}
        description={`${user!.email} · role: ${profile?.role ?? "—"}`}
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="password">Password</TabsTrigger>
            <TabsTrigger value="capacity">Capacity</TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="mt-6">
            <div className="max-w-2xl">
              <ProfileForm
                email={user!.email ?? ""}
                initial={{
                  full_name: profile?.full_name ?? "",
                  avatar_url: profile?.avatar_url ?? "",
                }}
              />
            </div>
          </TabsContent>

          <TabsContent value="password" className="mt-6">
            <div className="max-w-md">
              <PasswordForm />
            </div>
          </TabsContent>

          <TabsContent value="capacity" className="mt-6">
            <div className="max-w-md rounded-xl border border-line bg-bg-2 p-5">
              <p className="section-label mb-3">Your capacity</p>
              <p className="font-display text-2xl text-text">
                {profile?.monthly_capacity_hours ?? 0}h / month
              </p>
              <p className="mt-2 text-xs text-text-3">
                Set by Alex in Settings → Team. To request a change, message
                Alex on WhatsApp.
              </p>
              {(profile?.fixed_monthly_cost_aed ?? 0) > 0 ? (
                <p className="mt-4 text-sm text-text-2">
                  Fixed monthly cost: AED{" "}
                  {(profile?.fixed_monthly_cost_aed ?? 0).toLocaleString(
                    "en-AE",
                  )}
                </p>
              ) : null}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
