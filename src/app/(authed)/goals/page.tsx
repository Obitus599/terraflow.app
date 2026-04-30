import { addMonths, format, isSameMonth, parseISO, startOfMonth } from "date-fns";

import {
  MonthlyLineChart,
  type MonthlyLineDatum,
} from "@/components/charts/monthly-line-chart";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAed, formatAedCompact } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Goals" };

const HORIZON_MONTHS = 6;

// Confidence weights for the forecast: a `commit` deal is treated as 100% in
// the close month; `best_case` 60%; `pipe` 25%. These match the standard
// sales-forecasting bands and can be moved into app_settings later if Alex
// wants to tune them.
const CONFIDENCE_WEIGHT: Record<string, number> = {
  commit: 1,
  best_case: 0.6,
  pipe: 0.25,
};

export default async function GoalsPage() {
  const supabase = await createClient();

  const [
    { data: clients },
    { data: deals },
    { data: settings },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select("monthly_aed, status")
      .eq("status", "active"),
    supabase
      .from("pipeline_deals")
      .select(
        "expected_aed_monthly, expected_aed_one_time, expected_close_month, confidence, stage",
      )
      .not("stage", "in", "(won,lost)"),
    supabase
      .from("app_settings")
      .select("mrr_target_aed, mrr_target_month")
      .limit(1)
      .maybeSingle(),
  ]);

  const currentMrr = (clients ?? []).reduce(
    (s, c) => s + (c.monthly_aed ?? 0),
    0,
  );
  const target = settings?.mrr_target_aed ?? 15000;
  const targetMonth = settings?.mrr_target_month
    ? parseISO(settings.mrr_target_month)
    : addMonths(new Date(), 6);
  const gap = Math.max(0, target - currentMrr);

  // Build the next N months starting from this month. For each month, sum:
  //   recurring   = current active MRR (assumed flat — clients don't churn
  //                 in the forecast horizon by default)
  //   new_paid    = sum(deals.expected_aed_monthly * weight) where the
  //                 close month falls in this slot AND it's recurring
  //   one_time    = sum(deals.expected_aed_one_time * weight) similarly
  // Cumulative new_paid carries forward (those deals stay closed-won and
  // contribute to future months' recurring).
  const monthStart = startOfMonth(new Date());

  // Step 1: per-month forecast contributions (pure, no closure mutation).
  const monthlyForecasts = Array.from({ length: HORIZON_MONTHS }, (_, i) => {
    const month = addMonths(monthStart, i);
    const monthDeals = (deals ?? []).filter((d) => {
      if (!d.expected_close_month) return false;
      return isSameMonth(parseISO(d.expected_close_month), month);
    });
    const newRecurring = monthDeals.reduce(
      (s, d) =>
        s +
        (d.expected_aed_monthly ?? 0) * (CONFIDENCE_WEIGHT[d.confidence] ?? 0),
      0,
    );
    const oneTime = monthDeals.reduce(
      (s, d) =>
        s +
        (d.expected_aed_one_time ?? 0) * (CONFIDENCE_WEIGHT[d.confidence] ?? 0),
      0,
    );
    return { month, newRecurring, oneTime };
  });

  // Step 2: accumulate via reduce returning a new array each iteration —
  // no reassignment of closure variables, so the React Compiler immutability
  // rule stays satisfied.
  type Row = {
    month: Date;
    label: string;
    recurring: number;
    newPaid: number;
    oneTime: number;
    total: number;
    cumulative: number;
  };
  const cumulativeRows = monthlyForecasts.reduce<Row[]>((acc, mf) => {
    const prev = acc[acc.length - 1];
    const recurring = (prev?.recurring ?? currentMrr) + mf.newRecurring;
    const total = recurring + mf.oneTime;
    const cumulative = (prev?.cumulative ?? 0) + total;
    return [
      ...acc,
      {
        month: mf.month,
        label: format(mf.month, "MMM yyyy"),
        recurring,
        newPaid: mf.newRecurring,
        oneTime: mf.oneTime,
        total,
        cumulative,
      },
    ];
  }, []);

  const chartData: MonthlyLineDatum[] = cumulativeRows.map((r) => ({
    label: r.label,
    forecast: Math.round(r.recurring),
    target,
  }));

  // Final forecast MRR at horizon end
  const horizonRecurring = cumulativeRows[cumulativeRows.length - 1]?.recurring ?? currentMrr;

  return (
    <>
      <PageHeader
        eyebrow="Goals"
        title="6-month forecast"
        description={`Target ${formatAedCompact(target)} MRR by ${format(targetMonth, "MMM yyyy")}`}
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-3 lg:grid-cols-3">
          <KpiCard
            label="Current MRR"
            value={formatAed(currentMrr)}
            tone="accent"
          />
          <KpiCard
            label="Target MRR"
            value={formatAed(target)}
          />
          <KpiCard
            label="Gap"
            value={formatAed(gap)}
            hint={
              gap === 0
                ? "Hit"
                : `Need +${formatAedCompact(gap)} from pipeline`
            }
            tone={gap === 0 ? "success" : "default"}
          />
        </section>

        <section className="rounded-xl border border-line bg-bg-2 p-5">
          <p className="section-label mb-4">
            Forecast vs target · weighted by confidence (commit 100% · best
            case 60% · pipe 25%)
          </p>
          <MonthlyLineChart data={chartData} />
          <p className="mt-3 text-xs text-text-3">
            Forecast at end of horizon: {formatAed(Math.round(horizonRecurring))}{" "}
            ·{" "}
            {horizonRecurring >= target
              ? `${formatAedCompact(horizonRecurring - target)} above target`
              : `${formatAedCompact(target - horizonRecurring)} below target`}
          </p>
        </section>

        <section>
          <p className="section-label mb-4">Forecast table</p>
          <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  <TableHead>Month</TableHead>
                  <TableHead className="text-right">Recurring</TableHead>
                  <TableHead className="text-right">New paid</TableHead>
                  <TableHead className="text-right">One-time</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead className="text-right">Cumulative</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cumulativeRows.map((row) => (
                  <TableRow key={row.label} className="border-line">
                    <TableCell className="text-sm text-text">
                      {row.label}
                    </TableCell>
                    <TableCell className="text-right font-display text-sm text-text">
                      {formatAed(Math.round(row.recurring))}
                    </TableCell>
                    <TableCell className="text-right text-sm text-text-2">
                      {row.newPaid > 0
                        ? `+${formatAed(Math.round(row.newPaid))}`
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right text-sm text-text-2">
                      {row.oneTime > 0
                        ? formatAed(Math.round(row.oneTime))
                        : "—"}
                    </TableCell>
                    <TableCell className="text-right font-display text-sm text-text">
                      {formatAed(Math.round(row.total))}
                    </TableCell>
                    <TableCell className="text-right text-sm text-text-3">
                      {formatAed(Math.round(row.cumulative))}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </section>
      </div>
    </>
  );
}
