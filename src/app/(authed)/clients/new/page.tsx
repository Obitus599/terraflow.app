import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { ClientForm } from "../_components/client-form";

export const metadata = { title: "New client" };

export default async function NewClientPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();

  if (profile?.role !== "admin") {
    redirect("/clients");
  }

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="New client"
        description="Add a recurring or project client. Monthly AED feeds the MRR roll-up."
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <ClientForm mode="create" />
        </div>
      </div>
    </>
  );
}
