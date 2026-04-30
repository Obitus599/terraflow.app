import { Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import type { DealInput } from "@/lib/pipeline/schema";
import { createClient } from "@/lib/supabase/server";

import { DealSheet } from "./_components/deal-sheet";
import { KanbanBoard, type KanbanDeal } from "./_components/kanban-board";
import { SummaryPanel } from "./_components/summary-panel";

export const metadata = { title: "Pipeline" };

interface SearchParams {
  edit?: string;
  new?: string;
}

export default async function PipelinePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Active deals for the kanban board (won/lost excluded). If a user is
  // currently editing a won/lost deal via the sheet, we still need to fetch
  // it separately so the form has its data.
  const [{ data: deals }, { data: profiles }, { data: profile }] =
    await Promise.all([
      supabase
        .from("pipeline_deals")
        .select(
          "id, prospect_name, company, stage, source, confidence, expected_aed_monthly, expected_aed_one_time, expected_close_month, last_touch, next_action, owner_id, notes, won_lost_reason",
        )
        .order("expected_aed_monthly", { ascending: false }),
      supabase.from("profiles").select("id, full_name").order("full_name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle(),
    ]);

  const allDeals = deals ?? [];
  const activeDeals = allDeals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost",
  );

  const ownerNamesById: Record<string, string> = Object.fromEntries(
    (profiles ?? []).map((p) => [p.id, p.full_name]),
  );

  const kanbanDeals: KanbanDeal[] = activeDeals.map((d) => ({
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

  // Sheet state from URL
  const editingDeal = params.edit
    ? allDeals.find((d) => d.id === params.edit) ?? null
    : null;
  const sheetMode: "create" | "edit" | "closed" =
    editingDeal ? "edit" : params.new === "1" ? "create" : "closed";
  const sheetInitial: Partial<DealInput> | undefined = editingDeal
    ? {
        prospect_name: editingDeal.prospect_name,
        company: editingDeal.company ?? "",
        source: editingDeal.source as DealInput["source"],
        stage: editingDeal.stage as DealInput["stage"],
        confidence: editingDeal.confidence as DealInput["confidence"],
        expected_aed_monthly: editingDeal.expected_aed_monthly,
        expected_aed_one_time: editingDeal.expected_aed_one_time,
        expected_close_month: editingDeal.expected_close_month ?? "",
        last_touch: editingDeal.last_touch ?? "",
        next_action: editingDeal.next_action ?? "",
        owner_id: editingDeal.owner_id ?? "",
        notes: editingDeal.notes ?? "",
        won_lost_reason: editingDeal.won_lost_reason ?? "",
      }
    : sheetMode === "create"
      ? { owner_id: user!.id }
      : undefined;

  return (
    <>
      <PageHeader
        eyebrow="Pipeline"
        title="Active deals"
        description="Drag a card to move stages. Click a card to edit. Won/lost deals are reachable via direct edit links from elsewhere."
        actions={
          <Button asChild>
            <Link href="/pipeline?new=1">
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

      <DealSheet
        mode={sheetMode}
        dealId={editingDeal?.id}
        initial={sheetInitial}
        owners={profiles ?? []}
        canDelete={profile?.role === "admin"}
      />
    </>
  );
}
