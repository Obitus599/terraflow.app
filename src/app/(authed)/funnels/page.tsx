import { GitFork, Plus } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { FUNNEL_CHANNEL_LABELS } from "@/lib/funnels/schema";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Funnels" };

export default async function FunnelsPage() {
  const supabase = await createClient();

  const [{ data: funnels }, { data: stages }, { data: runs }] =
    await Promise.all([
      supabase
        .from("funnels")
        .select(
          "id, name, description, channel, archived, created_at, owner_id",
        )
        .eq("is_template", false)
        .eq("archived", false)
        .order("created_at", { ascending: true }),
      supabase
        .from("funnel_stages")
        .select("id, funnel_id, sort_order"),
      supabase
        .from("funnel_runs")
        .select("funnel_id, outcome"),
    ]);

  const stageCount = new Map<string, number>();
  for (const s of stages ?? []) {
    stageCount.set(s.funnel_id, (stageCount.get(s.funnel_id) ?? 0) + 1);
  }
  const runStats = new Map<
    string,
    { total: number; in_progress: number; won: number; lost: number }
  >();
  for (const r of runs ?? []) {
    const cur = runStats.get(r.funnel_id) ?? {
      total: 0,
      in_progress: 0,
      won: 0,
      lost: 0,
    };
    cur.total += 1;
    if (r.outcome === "in_progress") cur.in_progress += 1;
    if (r.outcome === "won") cur.won += 1;
    if (r.outcome === "lost") cur.lost += 1;
    runStats.set(r.funnel_id, cur);
  }

  return (
    <>
      <PageHeader
        eyebrow="Funnels"
        title="Acquisition funnels"
        description={`${funnels?.length ?? 0} active. Build new ones from a template, or design your own.`}
        actions={
          <Button asChild>
            <Link href="/funnels/new">
              <Plus className="mr-1 h-4 w-4" />
              New funnel
            </Link>
          </Button>
        }
      />

      <div className="px-6 py-6 md:px-10 md:py-8">
        {!funnels || funnels.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
            No funnels yet. Pick a template to get going.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {funnels.map((f) => {
              const stats = runStats.get(f.id) ?? {
                total: 0,
                in_progress: 0,
                won: 0,
                lost: 0,
              };
              const winRate =
                stats.won + stats.lost > 0
                  ? stats.won / (stats.won + stats.lost)
                  : 0;
              return (
                <Link
                  key={f.id}
                  href={`/funnels/${f.id}`}
                  className="group flex flex-col rounded-xl border border-line bg-bg-2 p-5 transition-colors hover:border-text-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-2">
                      <GitFork className="h-4 w-4 shrink-0 text-text-3" />
                      <h3 className="truncate font-display text-base font-medium text-text group-hover:text-accent">
                        {f.name}
                      </h3>
                    </div>
                    <StatusPill tone="muted">
                      {
                        FUNNEL_CHANNEL_LABELS[
                          f.channel as keyof typeof FUNNEL_CHANNEL_LABELS
                        ]
                      }
                    </StatusPill>
                  </div>

                  {f.description ? (
                    <p className="mt-2 line-clamp-2 text-xs text-text-3">
                      {f.description}
                    </p>
                  ) : null}

                  <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                    <div>
                      <p className="font-display text-lg text-text">
                        {stages
                          ? (stageCount.get(f.id) ?? 0)
                          : 0}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-3">
                        Stages
                      </p>
                    </div>
                    <div>
                      <p className="font-display text-lg text-text">
                        {stats.in_progress}
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-3">
                        Active
                      </p>
                    </div>
                    <div>
                      <p
                        className={
                          winRate >= 0.3
                            ? "font-display text-lg text-success"
                            : "font-display text-lg text-text"
                        }
                      >
                        {(winRate * 100).toFixed(0)}%
                      </p>
                      <p className="text-[10px] uppercase tracking-[0.18em] text-text-3">
                        Win rate
                      </p>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
