import { format, isSameMonth, parseISO, subMonths } from "date-fns";
import { ArrowDownRight, ArrowUpRight, Plus } from "lucide-react";
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
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CASH_CATEGORY_LABELS,
} from "@/lib/cashflow/schema";
import { formatAed } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";

import { BalanceEditor } from "./_components/balance-editor";

export const metadata = { title: "Cash flow" };

export default async function CashFlowPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: entries },
    { data: bank },
    { data: settings },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("cash_flow_entries")
      .select(
        "id, entry_date, direction, category, description, amount_aed, notes",
      )
      .order("entry_date", { ascending: false })
      .limit(500),
    supabase
      .from("bank_balance")
      .select("current_aed")
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("app_settings")
      .select("min_cash_alarm_aed")
      .limit(1)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin";
  const all = entries ?? [];
  const ins = all.filter((e) => e.direction === "in");
  const outs = all.filter((e) => e.direction === "out");

  const today = new Date();
  const months = Array.from({ length: 12 }, (_, i) => subMonths(today, 11 - i));
  const monthlyNet = months.map((m) => {
    const ins30 = all
      .filter(
        (e) => e.direction === "in" && isSameMonth(parseISO(e.entry_date), m),
      )
      .reduce((s, e) => s + e.amount_aed, 0);
    const outs30 = all
      .filter(
        (e) => e.direction === "out" && isSameMonth(parseISO(e.entry_date), m),
      )
      .reduce((s, e) => s + e.amount_aed, 0);
    return { label: format(m, "MMM"), value: ins30 - outs30 };
  });

  const totalIn = ins.reduce((s, e) => s + e.amount_aed, 0);
  const totalOut = outs.reduce((s, e) => s + e.amount_aed, 0);
  const net = totalIn - totalOut;

  return (
    <>
      <PageHeader
        eyebrow="Cash flow"
        title="In & out"
        description={`${all.length} entries · Net ${formatAed(net)}`}
        actions={
          isAdmin ? (
            <Button asChild>
              <Link href="/cash-flow/new">
                <Plus className="mr-1 h-4 w-4" />
                Log entry
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="space-y-6 px-6 py-6 md:px-10 md:py-8">
        <BalanceEditor
          current={bank?.current_aed ?? 0}
          threshold={settings?.min_cash_alarm_aed ?? 10000}
          canEdit={isAdmin}
        />

        <div className="grid gap-3 lg:grid-cols-3">
          <KpiCard label="Total in" value={formatAed(totalIn)} tone="success" />
          <KpiCard label="Total out" value={formatAed(totalOut)} />
          <KpiCard
            label="Net"
            value={formatAed(net)}
            tone={net >= 0 ? "accent" : "danger"}
          />
        </div>

        <section className="rounded-xl border border-line bg-bg-2 p-5">
          <p className="section-label mb-4">Monthly net · last 12 months</p>
          <MonthlyBarChart data={monthlyNet} tooltipLabel="Net AED" />
        </section>

        <Tabs defaultValue="all">
          <TabsList>
            <TabsTrigger value="all">All · {all.length}</TabsTrigger>
            <TabsTrigger value="in">In · {ins.length}</TabsTrigger>
            <TabsTrigger value="out">Out · {outs.length}</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-4">
            <EntriesTable rows={all} />
          </TabsContent>
          <TabsContent value="in" className="mt-4">
            <EntriesTable rows={ins} />
          </TabsContent>
          <TabsContent value="out" className="mt-4">
            <EntriesTable rows={outs} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function EntriesTable({
  rows,
}: {
  rows: {
    id: string;
    entry_date: string;
    direction: string;
    category: string;
    description: string | null;
    amount_aed: number;
  }[];
}) {
  if (rows.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
        Nothing here yet.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
      <Table>
        <TableHeader>
          <TableRow className="border-line hover:bg-transparent">
            <TableHead>Date</TableHead>
            <TableHead className="w-12" />
            <TableHead>Description</TableHead>
            <TableHead className="hidden sm:table-cell">Category</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((e) => (
            <TableRow key={e.id} className="border-line">
              <TableCell className="text-sm text-text-2">
                {e.entry_date}
              </TableCell>
              <TableCell>
                {e.direction === "in" ? (
                  <ArrowDownRight className="h-3.5 w-3.5 text-success" />
                ) : (
                  <ArrowUpRight className="h-3.5 w-3.5 text-text-3" />
                )}
              </TableCell>
              <TableCell className="text-sm text-text">
                {e.description ?? "—"}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-sm text-text-3">
                {CASH_CATEGORY_LABELS[
                  e.category as keyof typeof CASH_CATEGORY_LABELS
                ] ?? e.category}
              </TableCell>
              <TableCell
                className={
                  e.direction === "in"
                    ? "text-right font-display text-sm text-success"
                    : "text-right font-display text-sm text-text"
                }
              >
                {e.direction === "in" ? "+" : "−"}
                {formatAed(e.amount_aed)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
