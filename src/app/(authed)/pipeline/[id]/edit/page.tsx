import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import type { DealInput } from "@/lib/pipeline/schema";
import { createClient } from "@/lib/supabase/server";

import { DealForm } from "../../_components/deal-form";

export const metadata = { title: "Edit deal" };

export default async function EditDealPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: deal }, { data: profiles }, { data: profile }] =
    await Promise.all([
      supabase
        .from("pipeline_deals")
        .select(
          "id, prospect_name, company, source, stage, confidence, expected_aed_monthly, expected_aed_one_time, expected_close_month, last_touch, next_action, owner_id, notes, won_lost_reason",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle(),
    ]);

  if (!deal) notFound();

  const initial: Partial<DealInput> = {
    prospect_name: deal.prospect_name,
    company: deal.company ?? "",
    source: deal.source as DealInput["source"],
    stage: deal.stage as DealInput["stage"],
    confidence: deal.confidence as DealInput["confidence"],
    expected_aed_monthly: deal.expected_aed_monthly,
    expected_aed_one_time: deal.expected_aed_one_time,
    expected_close_month: deal.expected_close_month ?? "",
    last_touch: deal.last_touch ?? "",
    next_action: deal.next_action ?? "",
    owner_id: deal.owner_id ?? "",
    notes: deal.notes ?? "",
    won_lost_reason: deal.won_lost_reason ?? "",
  };

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/pipeline"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Pipeline
          </Link>
        }
        title="Edit deal"
        description={deal.prospect_name}
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <DealForm
            mode="edit"
            dealId={deal.id}
            owners={profiles ?? []}
            initial={initial}
            canDelete={profile?.role === "admin"}
          />
        </div>
      </div>
    </>
  );
}
