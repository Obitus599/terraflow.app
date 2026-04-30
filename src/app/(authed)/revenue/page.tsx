import { format, isSameMonth, parseISO, subMonths } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";

import { MonthlyBarChart } from "@/components/charts/monthly-bar-chart";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatAed } from "@/lib/format";
import { REVENUE_TYPE_LABELS } from "@/lib/revenue/schema";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Revenue" };

export default async function RevenuePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: entries }, { data: clients }, { data: profile }] =
    await Promise.all([
      supabase
        .from("revenue_entries")
        .select(
          "id, received_date, client_id, invoice_number, amount_aed, entry_type, notes",
        )
        .order("received_date", { ascending: false })
        .limit(500),
      supabase.from("clients").select("id, name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle(),
    ]);

  const isAdmin = profile?.role === "admin";
  const clientsById = new Map(
    (clients ?? []).map((c) => [c.id, c.name] as const),
  );

  // 12-month bucket starting 11 months ago through now
  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => subMonths(today, 11 - i));
  const monthly = months.map((m) => ({
    label: format(m, "MMM"),
    value: (entries ?? [])
      .filter((e) => isSameMonth(parseISO(e.received_date), m))
      .reduce((s, e) => s + (e.amount_aed ?? 0), 0),
  }));

  const ytd = (entries ?? [])
    .filter((e) => parseISO(e.received_date).getFullYear() === today.getFullYear())
    .reduce((s, e) => s + (e.amount_aed ?? 0), 0);
  const lastMonthTotal = monthly[monthly.length - 2]?.value ?? 0;
  const thisMonthTotal = monthly[monthly.length - 1]?.value ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Revenue"
        title="Cash collected"
        description={`${(entries ?? []).length} entries · YTD ${formatAed(ytd)}`}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/revenue/new">
                <Plus className="mr-1 h-4 w-4" />
                Log payment
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-3 lg:grid-cols-3">
          <KpiCard
            label="This month"
            value={formatAed(thisMonthTotal)}
            tone="accent"
          />
          <KpiCard label="Last month" value={formatAed(lastMonthTotal)} />
          <KpiCard label="YTD" value={formatAed(ytd)} />
        </section>

        <section className="rounded-xl border border-line bg-bg-2 p-5">
          <p className="section-label mb-4">Monthly · last 12 months</p>
          <MonthlyBarChart data={monthly} tooltipLabel="Revenue" />
        </section>

        <section>
          <p className="section-label mb-4">Transactions</p>
          {!entries || entries.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
              No revenue logged yet.
              {isAdmin ? " Click ‘Log payment' to record the first one." : ""}
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead>Date</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="hidden md:table-cell">Invoice</TableHead>
                    <TableHead className="hidden sm:table-cell">Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((e) => (
                    <TableRow key={e.id} className="border-line">
                      <TableCell className="text-sm text-text-2">
                        {e.received_date}
                      </TableCell>
                      <TableCell className="text-sm text-text">
                        {e.client_id
                          ? (clientsById.get(e.client_id) ?? "—")
                          : "—"}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-text-3">
                        {e.invoice_number ?? "—"}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-sm text-text-3">
                        {REVENUE_TYPE_LABELS[
                          e.entry_type as keyof typeof REVENUE_TYPE_LABELS
                        ] ?? e.entry_type}
                      </TableCell>
                      <TableCell className="text-right font-display text-sm text-text">
                        {formatAed(e.amount_aed)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </section>
      </div>
    </>
  );
}
