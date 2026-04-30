import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { RevenueForm } from "../_components/revenue-form";

export const metadata = { title: "Log payment" };

export default async function NewRevenuePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const [{ data: profile }, { data: clients }] = await Promise.all([
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
    supabase.from("clients").select("id, name").order("name"),
  ]);

  if (profile?.role !== "admin") redirect("/revenue");

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/revenue"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Revenue
          </Link>
        }
        title="Log payment"
        description="Record a payment received. Cash basis only — date is the day the money landed."
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <RevenueForm clients={clients ?? []} />
        </div>
      </div>
    </>
  );
}
