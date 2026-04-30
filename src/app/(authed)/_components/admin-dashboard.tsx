import { addDays, format, startOfToday, startOfWeek } from "date-fns";
import { ArrowRight, Flame } from "lucide-react";
import Link from "next/link";

import { AlarmRow } from "@/components/alarm-row";
import { KpiCard } from "@/components/kpi-card";
import { StatusPill } from "@/components/status-pill";
import { formatAed, formatAedCompact } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
} from "@/lib/tasks/schema";

const PIPELINE_STAGES = [
  { key: "first_touch", label: "First touch" },
  { key: "replied", label: "Replied" },
  { key: "call_booked", label: "Call booked" },
  { key: "proposal_sent", label: "Proposal sent" },
  { key: "mou_signed", label: "MOU signed" },
  { key: "kickoff", label: "Kickoff" },
] as const;

interface AdminDashboardProps {
  firstName: string;
}

export async function AdminDashboard({ firstName }: AdminDashboardProps) {
  const supabase = await createClient();
  const today = startOfToday();
  const todayStr = format(today, "yyyy-MM-dd");
  const thirtyDaysAgoStr = format(addDays(today, -30), "yyyy-MM-dd");
  const weekStartStr = format(startOfWeek(today, { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEndStr = format(addDays(today, 7), "yyyy-MM-dd");

  const [
    { data: clients },
    { data: deals },
    { data: tasks },
    { data: emails },
    { data: bank },
    { data: settings },
    { data: profiles },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("monthly_aed, status")
      .eq("status", "active"),
    supabase
      .from("pipeline_deals")
      .select("id, stage, expected_aed_monthly, prospect_name, company"),
    supabase
      .from("tasks")
      .select(
        "id, title, status, priority, due_date, owner_id, estimated_hours, updated_at",
      ),
    supabase
      .from("cold_email_entries")
      .select("sent, replied, bounced, sent_date")
      .gte("sent_date", thirtyDaysAgoStr),
    supabase
      .from("bank_balance")
      .select("current_aed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("app_settings")
      .select("mrr_target_aed, min_cash_alarm_aed, max_bounce_rate")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("id, full_name, monthly_capacity_hours"),
  ]);

  // KPI: revenue
  const mrr = (clients ?? []).reduce((s, c) => s + (c.monthly_aed ?? 0), 0);
  const cash = bank?.current_aed ?? 0;
  const target = settings?.mrr_target_aed ?? 15000;
  const goalGap = Math.max(0, target - mrr);

  const openDeals = (deals ?? []).filter(
    (d) => d.stage !== "won" && d.stage !== "lost",
  );
  const pipelineMonthly = openDeals.reduce(
    (s, d) => s + (d.expected_aed_monthly ?? 0),
    0,
  );
  const stageCounts = new Map<string, { count: number; aed: number }>();
  for (const d of openDeals) {
    const cur = stageCounts.get(d.stage) ?? { count: 0, aed: 0 };
    stageCounts.set(d.stage, {
      count: cur.count + 1,
      aed: cur.aed + (d.expected_aed_monthly ?? 0),
    });
  }
  const maxStageCount = Math.max(
    ...PIPELINE_STAGES.map((s) => stageCounts.get(s.key)?.count ?? 0),
    1,
  );

  // KPI: cold email
  const sent = (emails ?? []).filter((e) => e.sent).length;
  const replied = (emails ?? []).filter((e) => e.replied).length;
  const bounced = (emails ?? []).filter((e) => e.bounced).length;
  const replyRate = sent > 0 ? replied / sent : 0;
  const bounceRate = sent > 0 ? bounced / sent : 0;

  // KPI: tasks
  const allTasks = tasks ?? [];
  const openTasks = allTasks.filter((t) => t.status !== "done");
  const doneThisWeek = allTasks.filter(
    (t) =>
      t.status === "done" &&
      t.updated_at &&
      t.updated_at >= weekStartStr,
  ).length;
  const blocked = allTasks.filter((t) => t.status === "blocked").length;
  const overdue = openTasks.filter(
    (t) => t.due_date && t.due_date < todayStr,
  ).length;

  // Today's priorities
  const topP0 = openTasks
    .filter((t) => t.priority === "p0")
    .sort((a, b) => (a.due_date ?? "9999") .localeCompare(b.due_date ?? "9999"))[0];
  const topP1 = openTasks
    .filter(
      (t) =>
        t.priority === "p1" &&
        t.due_date &&
        t.due_date >= todayStr &&
        t.due_date <= weekEndStr,
    )
    .sort((a, b) => (a.due_date ?? "").localeCompare(b.due_date ?? ""))[0];

  // Raj capacity
  const raj = (profiles ?? []).find(
    (p) => p.full_name.toLowerCase() === "raj",
  );
  const rajAllocated = raj
    ? openTasks
        .filter((t) => t.owner_id === raj.id)
        .reduce((s, t) => s + Number(t.estimated_hours ?? 0), 0)
    : 0;
  const rajCapacity = raj?.monthly_capacity_hours ?? 0;
  const rajOver = rajCapacity > 0 && rajAllocated > rajCapacity;

  // Alarms
  const minCash = settings?.min_cash_alarm_aed ?? 10000;
  const maxBounce = settings?.max_bounce_rate ?? 0.05;
  const cashLow = cash < minCash;
  const bounceHigh = bounceRate > maxBounce;

  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <p className="section-label mb-4">Admin · home</p>
      <h1 className="font-display text-3xl font-medium tracking-tight text-text md:text-4xl">
        Welcome, <span className="text-accent">{firstName}</span>
      </h1>
      <p className="mt-2 text-sm text-text-3">
        {format(today, "EEEE, d MMMM yyyy")} · here&apos;s the morning check.
      </p>

      <section className="mt-10 space-y-3">
        <h2 className="section-label">Revenue & pipeline</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard
            label="Current MRR"
            value={formatAedCompact(mrr)}
            hint={`Target ${formatAedCompact(target)}`}
            tone="accent"
          />
          <KpiCard
            label="Cash in bank"
            value={formatAedCompact(cash)}
            hint={cashLow ? `Below ${formatAedCompact(minCash)}` : "OK"}
            tone={cashLow ? "danger" : "default"}
          />
          <KpiCard
            label="Pipeline / mo"
            value={formatAedCompact(pipelineMonthly)}
            hint={`${openDeals.length} open deals`}
          />
          <KpiCard
            label="Goal gap"
            value={formatAedCompact(goalGap)}
            hint={goalGap === 0 ? "Hit target" : "AED to target"}
            tone={goalGap === 0 ? "success" : "default"}
          />
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="section-label">Cold email · last 30 days</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Sent" value={String(sent)} />
          <KpiCard label="Replies" value={String(replied)} />
          <KpiCard
            label="Reply rate"
            value={`${(replyRate * 100).toFixed(1)}%`}
            tone={replyRate >= 0.05 ? "success" : "default"}
          />
          <KpiCard
            label="Bounce rate"
            value={`${(bounceRate * 100).toFixed(1)}%`}
            tone={bounceHigh ? "danger" : "default"}
          />
        </div>
      </section>

      <section className="mt-8 space-y-3">
        <h2 className="section-label">Tasks</h2>
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <KpiCard label="Open" value={String(openTasks.length)} />
          <KpiCard label="Done this week" value={String(doneThisWeek)} tone={doneThisWeek > 0 ? "success" : "default"} />
          <KpiCard label="Blocked" value={String(blocked)} tone={blocked > 0 ? "warning" : "default"} />
          <KpiCard label="Overdue" value={String(overdue)} tone={overdue > 0 ? "danger" : "default"} />
        </div>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="section-label">Alarms</h2>
        <div className="space-y-2">
          <AlarmRow
            label="Cash runway"
            description={`Floor: ${formatAed(minCash)}`}
            value={cashLow ? `Low — ${formatAedCompact(cash)}` : `OK — ${formatAedCompact(cash)}`}
            triggered={cashLow}
          />
          <AlarmRow
            label="Bounce rate"
            description={`Cap: ${(maxBounce * 100).toFixed(1)}%`}
            value={`${(bounceRate * 100).toFixed(1)}%`}
            triggered={bounceHigh}
          />
          <AlarmRow
            label="Tasks overdue"
            description="Open tasks past due date"
            value={String(overdue)}
            triggered={overdue > 0}
          />
          <AlarmRow
            label="Raj capacity"
            description={
              raj
                ? `${rajAllocated.toFixed(1)}h allocated of ${rajCapacity}h capacity`
                : "Raj profile not loaded"
            }
            value={
              raj
                ? rajOver
                  ? `Over by ${(rajAllocated - rajCapacity).toFixed(1)}h`
                  : `${Math.round((rajAllocated / Math.max(1, rajCapacity)) * 100)}%`
                : "—"
            }
            triggered={rajOver}
          />
        </div>
      </section>

      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="section-label mb-3">Today&apos;s priorities</h2>
          <div className="space-y-2">
            {topP0 ? (
              <PriorityCard task={topP0} />
            ) : (
              <p className="rounded-xl border border-line bg-bg-2 px-5 py-6 text-sm text-text-3">
                No P0 open. Nice.
              </p>
            )}
            {topP1 ? (
              <PriorityCard task={topP1} />
            ) : (
              <p className="rounded-xl border border-line bg-bg-2 px-5 py-6 text-sm text-text-3">
                No P1 due this week.
              </p>
            )}
          </div>
        </div>

        <div>
          <h2 className="section-label mb-3">Pipeline at a glance</h2>
          <div className="rounded-xl border border-line bg-bg-2 p-5">
            <div className="space-y-2">
              {PIPELINE_STAGES.map((s) => {
                const stat = stageCounts.get(s.key) ?? { count: 0, aed: 0 };
                const widthPct = (stat.count / maxStageCount) * 100;
                return (
                  <div key={s.key} className="space-y-1">
                    <div className="flex items-baseline justify-between text-xs">
                      <span className="text-text-2">{s.label}</span>
                      <span className="text-text-3">
                        {stat.count} · {formatAedCompact(stat.aed)}
                      </span>
                    </div>
                    <div className="relative h-1.5 overflow-hidden rounded-full bg-bg-3">
                      <div
                        className="absolute inset-y-0 left-0 bg-accent"
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/pipeline"
              className="mt-5 inline-flex items-center gap-1 text-xs text-text-3 transition-colors hover:text-accent"
            >
              Open pipeline
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

function PriorityCard({
  task,
}: {
  task: {
    id: string;
    title: string;
    priority: string;
    due_date: string | null;
  };
}) {
  return (
    <Link
      href={`/tasks/${task.id}/edit`}
      className="group flex items-start justify-between gap-3 rounded-xl border border-line bg-bg-2 px-5 py-4 transition-colors hover:border-text-3"
    >
      <div className="flex min-w-0 items-start gap-3">
        <Flame className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
        <div className="min-w-0">
          <p className="truncate text-sm text-text group-hover:text-accent">
            {task.title}
          </p>
          <p className="mt-0.5 text-xs text-text-3">
            {task.due_date ?? "no due date"}
          </p>
        </div>
      </div>
      <StatusPill
        tone={TASK_PRIORITY_TONE[task.priority as "p0" | "p1" | "p2"]}
      >
        {TASK_PRIORITY_LABELS[task.priority as "p0" | "p1" | "p2"]}
      </StatusPill>
    </Link>
  );
}
