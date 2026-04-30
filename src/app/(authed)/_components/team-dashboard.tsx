import { format, startOfToday, startOfWeek } from "date-fns";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/kpi-card";
import { StatusPill } from "@/components/status-pill";
import { formatAedCompact } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from "@/lib/tasks/schema";
import { cn } from "@/lib/utils";

interface TeamDashboardProps {
  firstName: string;
  userId: string;
}

export async function TeamDashboard({ firstName, userId }: TeamDashboardProps) {
  const supabase = await createClient();
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");
  const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [
    { data: myTasks },
    { data: clients },
    { data: deals },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("tasks")
      .select(
        "id, title, status, priority, due_date, estimated_hours, updated_at",
      )
      .eq("owner_id", userId)
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false }),
    supabase
      .from("clients")
      .select("monthly_aed")
      .eq("status", "active"),
    supabase
      .from("pipeline_deals")
      .select("expected_aed_monthly, stage")
      .not("stage", "in", "(won,lost)"),
    supabase
      .from("profiles")
      .select("monthly_capacity_hours")
      .eq("id", userId)
      .maybeSingle(),
  ]);

  const open = (myTasks ?? []).filter((t) => t.status !== "done");
  const doneThisWeek = (myTasks ?? []).filter(
    (t) =>
      t.status === "done" &&
      t.updated_at &&
      t.updated_at >= weekStartStr,
  ).length;
  const overdue = open.filter(
    (t) => t.due_date && t.due_date < todayStr,
  ).length;

  const queue = open.slice(0, 5);

  const allocated = open.reduce(
    (s, t) => s + Number(t.estimated_hours ?? 0),
    0,
  );
  const capacity = profile?.monthly_capacity_hours ?? 0;
  const utilization =
    capacity > 0 ? Math.round((allocated / capacity) * 100) : 0;
  const utilTone =
    capacity === 0
      ? "muted"
      : utilization > 100
        ? "danger"
        : utilization > 85
          ? "warning"
          : "default";

  const mrr = (clients ?? []).reduce((s, c) => s + (c.monthly_aed ?? 0), 0);
  const pipelineMonthly = (deals ?? []).reduce(
    (s, d) => s + (d.expected_aed_monthly ?? 0),
    0,
  );

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <p className="section-label mb-4">Today</p>
      <h1 className="font-display text-3xl font-medium tracking-tight text-text md:text-4xl">
        Welcome, <span className="text-accent">{firstName}</span>
      </h1>
      <p className="mt-2 text-sm text-text-3">
        {format(today, "EEEE, d MMMM yyyy")}
      </p>

      <section className="mt-10 grid grid-cols-3 gap-3">
        <KpiCard label="My open" value={String(open.length)} />
        <KpiCard
          label="Done this week"
          value={String(doneThisWeek)}
          tone={doneThisWeek > 0 ? "success" : "default"}
        />
        <KpiCard
          label="Overdue"
          value={String(overdue)}
          tone={overdue > 0 ? "danger" : "default"}
        />
      </section>

      <section className="mt-10">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="section-label">My queue</h2>
          <Link
            href="/tasks"
            className="text-xs text-text-3 hover:text-accent"
          >
            All my tasks →
          </Link>
        </div>
        {queue.length === 0 ? (
          <p className="rounded-xl border border-line bg-bg-2 px-5 py-8 text-center text-sm text-text-3">
            Empty queue. Either you&apos;re ahead, or it&apos;s time to ask
            Alex for the next priority.
          </p>
        ) : (
          <ul className="divide-y divide-line rounded-xl border border-line bg-bg-2">
            {queue.map((t) => {
              const isOverdue =
                t.due_date && t.due_date < todayStr;
              return (
                <li key={t.id}>
                  <Link
                    href={`/tasks?edit=${t.id}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 transition-colors hover:bg-bg-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">{t.title}</p>
                      <p
                        className={cn(
                          "mt-0.5 text-xs",
                          isOverdue ? "text-danger" : "text-text-3",
                        )}
                      >
                        {t.due_date ?? "no due date"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <StatusPill
                        tone={
                          TASK_PRIORITY_TONE[t.priority as "p0" | "p1" | "p2"]
                        }
                      >
                        {TASK_PRIORITY_LABELS[t.priority as "p0" | "p1" | "p2"]}
                      </StatusPill>
                      <StatusPill
                        tone={
                          TASK_STATUS_TONE[
                            t.status as
                              | "not_started"
                              | "in_progress"
                              | "blocked"
                              | "done"
                          ]
                        }
                      >
                        {
                          TASK_STATUS_LABELS[
                            t.status as
                              | "not_started"
                              | "in_progress"
                              | "blocked"
                              | "done"
                          ]
                        }
                      </StatusPill>
                      <ArrowRight className="h-3.5 w-3.5 text-text-3" />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="section-label mb-3">Capacity this month</h2>
        <div className="rounded-xl border border-line bg-bg-2 px-5 py-5">
          <div className="flex items-baseline justify-between">
            <span className="text-sm text-text-2">
              {allocated.toFixed(1)}h allocated
              {capacity > 0 ? ` of ${capacity}h` : ""}
            </span>
            <span
              className={cn(
                "font-display text-sm",
                utilTone === "danger" && "text-danger",
                utilTone === "warning" && "text-warning",
                utilTone === "muted" && "text-text-3",
              )}
            >
              {capacity === 0 ? "no capacity set" : `${utilization}%`}
            </span>
          </div>
          {capacity > 0 ? (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-bg-3">
              <div
                className={cn(
                  "h-full",
                  utilTone === "danger"
                    ? "bg-danger"
                    : utilTone === "warning"
                      ? "bg-warning"
                      : "bg-accent",
                )}
                style={{ width: `${Math.min(100, utilization)}%` }}
              />
            </div>
          ) : null}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="section-label mb-3">Company snapshot</h2>
        <div className="grid grid-cols-2 gap-3">
          <KpiCard label="MRR" value={formatAedCompact(mrr)} tone="accent" />
          <KpiCard
            label="Pipeline / mo"
            value={formatAedCompact(pipelineMonthly)}
          />
        </div>
      </section>
    </main>
  );
}
