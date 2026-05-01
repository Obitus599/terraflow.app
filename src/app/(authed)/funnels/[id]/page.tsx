import { BarChart3, ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { InlineErrorBoundary } from "@/components/inline-error-boundary";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { FUNNEL_CHANNEL_LABELS } from "@/lib/funnels/schema";
import { createClient } from "@/lib/supabase/server";

import {
  FunnelKanban,
  type KanbanRun,
  type KanbanStage,
} from "./_components/funnel-kanban";

const NEXT_INTERNAL_DIGESTS = [
  "NEXT_REDIRECT",
  "NEXT_NOT_FOUND",
  "NEXT_HTTP_ERROR_FALLBACK",
  "DYNAMIC_SERVER_USAGE",
];

function isNextInternalError(e: unknown): boolean {
  if (!e || typeof e !== "object") return false;
  const digest = (e as { digest?: unknown }).digest;
  if (typeof digest !== "string") return false;
  return NEXT_INTERNAL_DIGESTS.some((p) => digest.startsWith(p));
}

interface FunnelRow {
  id: string;
  name: string;
  description: string | null;
  channel: string;
  archived: boolean;
  owner_id: string | null;
}

export default async function FunnelDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let dataError: { message: string; stack: string } | null = null;
  let funnel: FunnelRow | null = null;
  let kanbanStages: KanbanStage[] = [];
  let kanbanRuns: KanbanRun[] = [];
  let ownerNamesById: Record<string, string> = {};

  try {
    const supabase = await createClient();

    const [
      { data: funnelData },
      { data: stages },
      { data: runs },
      { data: profiles },
    ] = await Promise.all([
      supabase
        .from("funnels")
        .select("id, name, description, channel, archived, owner_id")
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("funnel_stages")
        .select(
          "id, name, sort_order, is_terminal_won, is_terminal_lost, target_conversion_pct, target_days",
        )
        .eq("funnel_id", id)
        .order("sort_order"),
      supabase
        .from("funnel_runs")
        .select("id, current_stage_id, outcome, pipeline_deal_id")
        .eq("funnel_id", id),
      supabase.from("profiles").select("id, full_name"),
    ]);

    if (!funnelData) notFound();
    funnel = funnelData;

    const dealIds = (runs ?? [])
      .map((r) => r.pipeline_deal_id)
      .filter((d): d is string => Boolean(d));

    const dealsByIdQuery =
      dealIds.length > 0
        ? await supabase
            .from("pipeline_deals")
            .select("id, prospect_name, company, expected_aed_monthly, owner_id")
            .in("id", dealIds)
        : { data: [] };
    const dealsById = new Map(
      (dealsByIdQuery.data ?? []).map((d) => [d.id, d] as const),
    );

    ownerNamesById = Object.fromEntries(
      (profiles ?? []).map((p) => [p.id, p.full_name]),
    );

    kanbanStages = (stages ?? []).map((s) => ({
      id: s.id,
      name: s.name,
      sort_order: s.sort_order,
      is_terminal_won: s.is_terminal_won,
      is_terminal_lost: s.is_terminal_lost,
    }));

    kanbanRuns = (runs ?? []).map((r) => {
      const deal = r.pipeline_deal_id ? dealsById.get(r.pipeline_deal_id) : null;
      return {
        id: r.id,
        current_stage_id: r.current_stage_id,
        outcome: r.outcome,
        prospect_name: deal?.prospect_name ?? null,
        company: deal?.company ?? null,
        expected_aed_monthly: deal?.expected_aed_monthly ?? 0,
        owner_id: deal?.owner_id ?? null,
      };
    });
  } catch (e) {
    if (isNextInternalError(e)) throw e;
    const message = e instanceof Error ? e.message : String(e);
    const stack = e instanceof Error ? (e.stack ?? "(no stack)") : "(no stack)";
    console.error("[funnels/[id]] data fetch threw", message, stack);
    dataError = { message, stack };
  }

  if (dataError) {
    return (
      <main className="px-6 py-12 md:px-10">
        <div className="mx-auto max-w-2xl rounded-xl border border-danger/30 bg-danger/5 p-6">
          <p className="text-xs uppercase tracking-[0.18em] text-danger">
            Funnel detail · diagnostic mode
          </p>
          <h1 className="mt-2 font-display text-xl font-medium text-text">
            Data fetch threw on /funnels/{id}
          </h1>
          <p className="mt-3 text-sm text-text-2">
            <strong className="text-text">Error:</strong>{" "}
            <code className="text-danger">{dataError.message}</code>
          </p>
          <pre className="mt-4 overflow-x-auto whitespace-pre-wrap rounded-md border border-line bg-bg-2 p-3 text-xs text-text-3">
            {dataError.stack}
          </pre>
        </div>
      </main>
    );
  }

  if (!funnel) notFound();

  const total = kanbanRuns.length;
  const inProgress = kanbanRuns.filter((r) => r.outcome === "in_progress").length;
  const won = kanbanRuns.filter((r) => r.outcome === "won").length;
  const lost = kanbanRuns.filter((r) => r.outcome === "lost").length;
  const winRate = won + lost > 0 ? won / (won + lost) : 0;

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/funnels"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Funnels
          </Link>
        }
        title={funnel.name}
        description={
          <span className="flex flex-wrap items-center gap-2 text-sm text-text-3">
            <StatusPill tone="muted">
              {FUNNEL_CHANNEL_LABELS[
                funnel.channel as keyof typeof FUNNEL_CHANNEL_LABELS
              ] ?? funnel.channel}
            </StatusPill>
            <span>{total} runs</span>
            <span>·</span>
            <span>{inProgress} active</span>
            <span>·</span>
            <span>
              {won}W / {lost}L · {(winRate * 100).toFixed(0)}% win rate
            </span>
          </span>
        }
        actions={
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost">
              <Link href={`/funnels/${funnel.id}/analytics`}>
                <BarChart3 className="mr-1 h-4 w-4" />
                Analytics
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href={`/funnels/${funnel.id}/edit`}>
                <Pencil className="mr-1 h-4 w-4" />
                Edit stages
              </Link>
            </Button>
          </div>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {kanbanStages.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
            This funnel has no stages yet.{" "}
            <Link href={`/funnels/${funnel.id}/edit`} className="text-accent">
              Add some
            </Link>
            .
          </p>
        ) : (
          <InlineErrorBoundary label="FunnelKanban">
            <FunnelKanban
              stages={kanbanStages}
              runs={kanbanRuns}
              ownerNamesById={ownerNamesById}
            />
          </InlineErrorBoundary>
        )}
      </div>
    </>
  );
}
