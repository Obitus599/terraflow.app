import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { ClientForm } from "../../_components/client-form";

export const metadata = { title: "Edit client" };

export default async function EditClientPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: client }, { data: profile }] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, client_type, monthly_aed, status, health, start_date, upsell_ideas, notes",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  if (!client) notFound();
  if (profile?.role !== "admin") redirect(`/clients/${id}`);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href={`/clients/${id}`}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            {client.name}
          </Link>
        }
        title="Edit client"
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <ClientForm
            mode="edit"
            clientId={client.id}
            initial={{
              name: client.name,
              client_type: client.client_type as "recurring" | "project" | "recurring_pending",
              monthly_aed: client.monthly_aed,
              status: client.status as "active" | "paused" | "churned" | "pending",
              health: client.health as "green" | "yellow" | "red",
              start_date: client.start_date ?? "",
              upsell_ideas: client.upsell_ideas ?? "",
              notes: client.notes ?? "",
            }}
          />
        </div>
      </div>
    </>
  );
}
