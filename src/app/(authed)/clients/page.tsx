import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { ClientCard } from "./_components/client-card";

export const metadata = { title: "Clients" };

export default async function ClientsPage() {
  const supabase = await createClient();

  const { data: clients, error } = await supabase
    .from("clients")
    .select(
      "id, name, client_type, monthly_aed, status, health, notes, upsell_ideas",
    )
    .order("name", { ascending: true });

  const { data: { user } } = await supabase.auth.getUser();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user!.id)
    .maybeSingle();
  const isAdmin = profile?.role === "admin";

  const totalMrr = (clients ?? []).reduce(
    (sum, c) => sum + (c.monthly_aed ?? 0),
    0,
  );
  const activeCount = (clients ?? []).filter((c) => c.status === "active").length;

  return (
    <>
      <PageHeader
        eyebrow="Clients"
        title="Active book"
        description={`${activeCount} active · MRR AED ${totalMrr.toLocaleString("en-AE")}`}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/clients/new">
                <Plus className="mr-1 h-4 w-4" />
                New client
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {error ? (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to load clients: {error.message}
          </p>
        ) : !clients || clients.length === 0 ? (
          <EmptyState isAdmin={isAdmin} />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {clients.map((c) => (
              <ClientCard key={c.id} client={c} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState({ isAdmin }: { isAdmin: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg-2 px-6 py-16 text-center">
      <p className="font-display text-base text-text">No clients yet</p>
      <p className="mt-1 max-w-sm text-sm text-text-3">
        {isAdmin
          ? "Add your first client to start tracking monthly recurring revenue, tasks, and health."
          : "Once Alex adds clients, they'll show up here."}
      </p>
      {isAdmin ? (
        <Button asChild className="mt-6">
          <Link href="/clients/new">
            <Plus className="mr-1 h-4 w-4" />
            New client
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
