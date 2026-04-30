import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

import { KanbanBoard, type KanbanDeal } from "./_components/kanban-board";
import { SummaryPanel } from "./_components/summary-panel";

export const metadata = { title: "Pipeline" };

export default async function PipelinePage() {
  const supabase = await createClient();

  const [{ data: deals }, { data: profiles }] = await Promise.all([
    supabase
      .from("pipeline_deals")
      .select(
        "id, prospect_name, company, stage, source, confidence, expected_aed_monthly, owner_id, next_action",
      )
      .not("stage", "in", "(won,lost)")
      .order("expected_aed_monthly", { ascending: false }),
    supabase.from("profiles").select("id, full_name"),
  ]);

  const ownerNamesById: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const kanbanDeals: KanbanDeal[] = (deals ?? []).map((d) => ({
    id: d.id,
    prospect_name: d.prospect_name,
    company: d.company,
    stage: d.stage,
    source: d.source,
    confidence: d.confidence,
    expected_aed_monthly: d.expected_aed_monthly,
    owner_id: d.owner_id,
    next_action: d.next_action,
  }));

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Active deals"
        description="Drag a card across columns to move stages. Won/lost are accessed via edit."
        actions={
          <Button asChild>
            <Link href="/pipeline/new">
              <Plus className="mr-1 h-4 w-4" />
              New deal
            </Link>
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="flex flex-col gap-4 lg:flex-row">
          <div className="flex-1 min-w-0">
            <KanbanBoard
              deals={kanbanDeals}
              ownerNamesById={ownerNamesById}
            />
          </div>
          <SummaryPanel deals={kanbanDeals} />
        </div>
      </div>
    </>
  );
}
