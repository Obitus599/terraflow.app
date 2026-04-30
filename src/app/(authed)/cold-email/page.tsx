import { addDays, format, startOfToday } from "date-fns";
import { Plus } from "lucide-react";
import Link from "next/link";

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
import { COLD_EMAIL_FLAGS, COLD_EMAIL_FLAG_LABELS } from "@/lib/cold-email/schema";
import { createClient } from "@/lib/supabase/server";

import { FlagCheckbox } from "./_components/flag-checkbox";

export const metadata = { title: "Cold email" };

export default async function ColdEmailPage() {
  const supabase = await createClient();
  const today = startOfToday();
  const thirtyDaysAgoStr = format(addDays(today, -30), "yyyy-MM-dd");

  const [{ data: entries }, { data: last30 }] = await Promise.all([
    supabase
      .from("cold_email_entries")
      .select(
        "id, sent_date, prospect_name, company, email, subject, sent, opened, replied, bounced, booked_call, notes",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("cold_email_entries")
      .select("sent, opened, replied, bounced, booked_call, sent_date")
      .gte("sent_date", thirtyDaysAgoStr),
  ]);

  const all = entries ?? [];
  const window = last30 ?? [];

  const sent30 = window.filter((e) => e.sent).length;
  const opened30 = window.filter((e) => e.opened).length;
  const replied30 = window.filter((e) => e.replied).length;
  const bounced30 = window.filter((e) => e.bounced).length;
  const booked30 = window.filter((e) => e.booked_call).length;
  const replyRate = sent30 > 0 ? replied30 / sent30 : 0;
  const bounceRate = sent30 > 0 ? bounced30 / sent30 : 0;
  const openRate = sent30 > 0 ? opened30 / sent30 : 0;

  return (
    <>
      <PageHeader
        eyebrow="Cold email"
        title="Outreach tracker"
        description={`${all.length} prospects total · ${sent30} sent in the last 30 days`}
        actions={
          <Button asChild>
            <Link href="/cold-email/new">
              <Plus className="mr-1 h-4 w-4" />
              Add prospect
            </Link>
          </Button>
        }
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-3 lg:grid-cols-4">
          <KpiCard label="Sent · 30d" value={String(sent30)} />
          <KpiCard
            label="Reply rate"
            value={`${(replyRate * 100).toFixed(1)}%`}
            tone={replyRate >= 0.05 ? "success" : "default"}
            hint={`${replied30} replies`}
          />
          <KpiCard
            label="Open rate"
            value={`${(openRate * 100).toFixed(1)}%`}
            hint={`${opened30} opens`}
          />
          <KpiCard
            label="Bounce rate"
            value={`${(bounceRate * 100).toFixed(1)}%`}
            tone={bounceRate > 0.05 ? "danger" : "default"}
            hint={`${bounced30} bounced`}
          />
        </section>

        <section>
          <p className="section-label mb-4">Booked: {booked30} call(s) in the last 30 days</p>
          {all.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
              No prospects yet. Click ‘Add prospect’ to start tracking.
            </p>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
              <Table>
                <TableHeader>
                  <TableRow className="border-line hover:bg-transparent">
                    <TableHead>Prospect</TableHead>
                    <TableHead className="hidden md:table-cell">Company</TableHead>
                    <TableHead className="hidden lg:table-cell">Subject</TableHead>
                    <TableHead className="hidden lg:table-cell">Sent date</TableHead>
                    {COLD_EMAIL_FLAGS.map((flag) => (
                      <TableHead key={flag} className="text-center">
                        {COLD_EMAIL_FLAG_LABELS[flag]}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {all.map((row) => (
                    <TableRow key={row.id} className="border-line">
                      <TableCell>
                        <p className="text-sm text-text">{row.prospect_name}</p>
                        <p className="text-xs text-text-3">{row.email}</p>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-text-2">
                        {row.company ?? "—"}
                      </TableCell>
                      <TableCell className="hidden lg:table-cell max-w-[16rem]">
                        <p className="truncate text-sm text-text-2">
                          {row.subject ?? "—"}
                        </p>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell text-sm text-text-3">
                        {row.sent_date ?? "—"}
                      </TableCell>
                      {COLD_EMAIL_FLAGS.map((flag) => (
                        <TableCell key={flag} className="text-center">
                          <FlagCheckbox
                            prospectId={row.id}
                            flag={flag}
                            initial={Boolean(row[flag])}
                            ariaLabel={`${row.prospect_name} ${COLD_EMAIL_FLAG_LABELS[flag]}`}
                          />
                        </TableCell>
                      ))}
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
