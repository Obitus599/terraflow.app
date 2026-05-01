import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export const metadata = { title: "Funnel analytics" };

interface StageRow {
  id: string;
  name: string;
  sort_order: number;
  target_conversion_pct: number;
  target_days: number;
  is_terminal_won: boolean;
  is_terminal_lost: boolean;
}

export default async function FunnelAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [
    { data: funnel },
    { data: stages },
    { data: runs },
    { data: transitions },
  ] = await Promise.all([
    supabase
      .from("funnels")
      .select("id, name, description, channel")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("funnel_stages")
      .select(
        "id, name, sort_order, target_conversion_pct, target_days, is_terminal_won, is_terminal_lost",
      )
      .eq("funnel_id", id)
      .order("sort_order"),
    supabase
      .from("funnel_runs")
      .select("id, current_stage_id, started_at, ended_at, outcome")
      .eq("funnel_id", id),
    supabase
      .from("funnel_stage_transitions")
      .select("funnel_run_id, from_stage_id, to_stage_id, transitioned_at")
      .order("transitioned_at"),
  ]);

  if (!funnel) notFound();

  const allStages = (stages ?? []) as StageRow[];
  const allRuns = runs ?? [];
  const allTransitions = transitions ?? [];

  // Filter transitions to those whose run belongs to this funnel.
  const runIdSet = new Set(allRuns.map((r) => r.id));
  const ourTransitions = allTransitions.filter((t) =>
    runIdSet.has(t.funnel_run_id),
  );

  // For each stage, count "ever entered" — every run that's been there
  // either via initial placement or a transition.
  const everEnteredByStage = new Map<string, Set<string>>();
  for (const stage of allStages) {
    everEnteredByStage.set(stage.id, new Set());
  }
  for (const r of allRuns) {
    if (r.current_stage_id) {
      everEnteredByStage.get(r.current_stage_id)?.add(r.id);
    }
  }
  for (const t of ourTransitions) {
    if (t.to_stage_id) {
      everEnteredByStage.get(t.to_stage_id)?.add(t.funnel_run_id);
    }
    if (t.from_stage_id) {
      // Even an out-transition implies the run was once in from_stage.
      everEnteredByStage.get(t.from_stage_id)?.add(t.funnel_run_id);
    }
  }

  // Time-in-stage average (median is more useful, but average is enough for
  // v1). For each transition pair (run X enters stage A at time T1, then
  // leaves at time T2), accumulate a duration sample for stage A.
  const stageDurationSums = new Map<string, number>();
  const stageDurationCounts = new Map<string, number>();
  // Collate per run: when did each stage begin / end?
  const transitionsByRun = new Map<string, typeof ourTransitions>();
  for (const t of ourTransitions) {
    const list = transitionsByRun.get(t.funnel_run_id) ?? [];
    list.push(t);
    transitionsByRun.set(t.funnel_run_id, list);
  }
  for (const list of transitionsByRun.values()) {
    list.sort(
      (a, b) =>
        new Date(a.transitioned_at).getTime() -
        new Date(b.transitioned_at).getTime(),
    );
    for (let i = 0; i < list.length - 1; i += 1) {
      const cur = list[i];
      const next = list[i + 1];
      if (!cur.to_stage_id) continue;
      const dur =
        (new Date(next.transitioned_at).getTime() -
          new Date(cur.transitioned_at).getTime()) /
        (1000 * 60 * 60 * 24);
      stageDurationSums.set(
        cur.to_stage_id,
        (stageDurationSums.get(cur.to_stage_id) ?? 0) + dur,
      );
      stageDurationCounts.set(
        cur.to_stage_id,
        (stageDurationCounts.get(cur.to_stage_id) ?? 0) + 1,
      );
    }
  }

  // Top-line KPIs
  const total = allRuns.length;
  const won = allRuns.filter((r) => r.outcome === "won").length;
  const lost = allRuns.filter((r) => r.outcome === "lost").length;
  const inProgress = allRuns.filter((r) => r.outcome === "in_progress").length;
  const winRate = won + lost > 0 ? won / (won + lost) : 0;
  const finishedRuns = allRuns.filter(
    (r) => r.ended_at && (r.outcome === "won" || r.outcome === "lost"),
  );
  const avgVelocityDays =
    finishedRuns.length > 0
      ? finishedRuns.reduce(
          (s, r) =>
            s +
            (new Date(r.ended_at!).getTime() -
              new Date(r.started_at).getTime()) /
              (1000 * 60 * 60 * 24),
          0,
        ) / finishedRuns.length
      : 0;

  // Sequential funnel (sorted by sort_order)
  const orderedStages = [...allStages].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href={`/funnels/${id}`}
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            {funnel.name}
          </Link>
        }
        title="Analytics"
        description="Stage-by-stage conversion vs targets, drop-off, and velocity from start to outcome."
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-3 lg:grid-cols-4">
          <KpiCard
            label="Total runs"
            value={String(total)}
            hint={`${inProgress} in progress`}
          />
          <KpiCard
            label="Win rate"
            value={`${(winRate * 100).toFixed(0)}%`}
            hint={`${won}W / ${lost}L`}
            tone={winRate >= 0.3 ? "success" : "default"}
          />
          <KpiCard
            label="Avg velocity"
            value={
              finishedRuns.length > 0
                ? `${avgVelocityDays.toFixed(1)}d`
                : "—"
            }
            hint={`${finishedRuns.length} finished runs`}
          />
          <KpiCard
            label="Open / closed"
            value={`${inProgress} / ${won + lost}`}
            hint="Live vs ended"
          />
        </section>

        <section>
          <p className="section-label mb-4">Stage-by-stage funnel</p>
          {orderedStages.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-8 text-center text-sm text-text-3">
              No stages defined yet.
            </p>
          ) : (
            <div className="rounded-xl border border-line bg-bg-2 p-5">
              <ul className="space-y-3">
                {orderedStages.map((stage, i) => {
                  const everEntered =
                    everEnteredByStage.get(stage.id)?.size ?? 0;
                  const prev =
                    i > 0
                      ? everEnteredByStage.get(orderedStages[i - 1].id)?.size ??
                        0
                      : null;
                  const conversionFromPrev =
                    prev && prev > 0 ? everEntered / prev : null;
                  const dropOff =
                    prev !== null && prev > 0
                      ? Math.max(0, prev - everEntered)
                      : 0;
                  const target = stage.target_conversion_pct;
                  const actualVsTarget =
                    target > 0 && conversionFromPrev !== null
                      ? conversionFromPrev - target
                      : null;
                  const avgDays =
                    stageDurationCounts.get(stage.id) ?? 0 > 0
                      ? (stageDurationSums.get(stage.id) ?? 0) /
                        (stageDurationCounts.get(stage.id) ?? 1)
                      : null;

                  // Width visualisation: relative to stage 0's everEntered
                  const baseline = everEnteredByStage.get(orderedStages[0].id)?.size ?? 1;
                  const widthPct =
                    baseline > 0 ? (everEntered / baseline) * 100 : 0;

                  return (
                    <li key={stage.id}>
                      <div className="flex items-baseline justify-between text-xs">
                        <span className="font-display text-sm text-text">
                          {stage.name}
                          {stage.is_terminal_won ? (
                            <span className="ml-2 text-xs text-success">
                              · won
                            </span>
                          ) : null}
                          {stage.is_terminal_lost ? (
                            <span className="ml-2 text-xs text-danger">
                              · lost
                            </span>
                          ) : null}
                        </span>
                        <span className="text-text-3">
                          {everEntered} entered
                          {conversionFromPrev !== null
                            ? ` · ${(conversionFromPrev * 100).toFixed(0)}% from prior`
                            : ""}
                          {dropOff > 0 ? (
                            <span className="text-danger">
                              {" "}
                              · {dropOff} drop
                            </span>
                          ) : null}
                          {avgDays !== null && avgDays > 0
                            ? ` · ${avgDays.toFixed(1)}d avg`
                            : ""}
                        </span>
                      </div>
                      <div className="mt-2 h-2 overflow-hidden rounded-full bg-bg-3">
                        <div
                          className={cn(
                            "h-full",
                            stage.is_terminal_won
                              ? "bg-success"
                              : stage.is_terminal_lost
                                ? "bg-danger"
                                : "bg-accent",
                          )}
                          style={{ width: `${widthPct}%` }}
                        />
                      </div>
                      {actualVsTarget !== null ? (
                        <p
                          className={
                            actualVsTarget >= 0
                              ? "mt-1 text-[11px] text-success"
                              : "mt-1 text-[11px] text-warning"
                          }
                        >
                          Target {(target * 100).toFixed(0)}% · actual{" "}
                          {((conversionFromPrev ?? 0) * 100).toFixed(0)}% (
                          {actualVsTarget >= 0 ? "+" : ""}
                          {(actualVsTarget * 100).toFixed(0)} vs target)
                        </p>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
