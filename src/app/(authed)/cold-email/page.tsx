import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { Mail, Plus } from "lucide-react";
import Link from "next/link";

import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
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
import { COLD_EMAIL_FLAGS, COLD_EMAIL_FLAG_LABELS } from "@/lib/cold-email/schema";
import { createClient } from "@/lib/supabase/server";

import { FlagCheckbox } from "./_components/flag-checkbox";
import { SequenceRow } from "./_components/sequence-row";
import { SyncButton } from "./_components/sync-button";

export const metadata = { title: "Cold email · war room" };

export default async function ColdEmailPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: sequences },
    { data: mailboxes },
    { data: prospects },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("apollo_sequences")
      .select(
        "id, name, active, archived, num_steps, unique_scheduled, unique_delivered, unique_bounced, unique_opened, unique_replied, unique_clicked, unique_spam_blocked, unique_unsubscribed, open_rate, bounce_rate, reply_rate, click_rate, is_performing_poorly, last_used_at, synced_at",
      )
      .order("last_used_at", { ascending: false, nullsFirst: false })
      .limit(50),
    supabase
      .from("apollo_email_accounts")
      .select(
        "id, email, provider, active, is_default, last_synced_at_apollo, synced_at",
      )
      .order("is_default", { ascending: false })
      .order("email"),
    supabase
      .from("cold_email_entries")
      .select(
        "id, sent_date, prospect_name, company, email, subject, sent, opened, replied, bounced, booked_call",
      )
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin";

  const allSeq = sequences ?? [];
  const totals = allSeq.reduce(
    (acc, s) => ({
      delivered: acc.delivered + s.unique_delivered,
      opened: acc.opened + s.unique_opened,
      replied: acc.replied + s.unique_replied,
      bounced: acc.bounced + s.unique_bounced,
      clicked: acc.clicked + s.unique_clicked,
    }),
    { delivered: 0, opened: 0, replied: 0, bounced: 0, clicked: 0 },
  );
  const aggOpenRate =
    totals.delivered > 0 ? totals.opened / totals.delivered : 0;
  const aggReplyRate =
    totals.delivered > 0 ? totals.replied / totals.delivered : 0;
  const aggBounceRate =
    totals.delivered > 0 ? totals.bounced / totals.delivered : 0;
  const activeSequences = allSeq.filter((s) => s.active && !s.archived).length;
  const lastSync = allSeq[0]?.synced_at
    ? formatDistanceToNowStrict(parseISO(allSeq[0].synced_at), {
        addSuffix: true,
      })
    : "never";

  // Manual prospect 30-day metrics, kept for the hand-personalized track.
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const thirtyDaysAgoStr = format(thirtyDaysAgo, "yyyy-MM-dd");
  const last30 = (prospects ?? []).filter(
    (p) => p.sent_date && p.sent_date >= thirtyDaysAgoStr,
  );
  const sent30 = last30.filter((e) => e.sent).length;
  const replied30 = last30.filter((e) => e.replied).length;

  return (
    <>
      <PageHeader
        eyebrow="Cold email"
        title="Outreach war room"
        description={`${activeSequences} active sequence(s) · ${allSeq.length} total · last Apollo sync ${lastSync}`}
        actions={
          <div className="flex items-center gap-2">
            {isAdmin ? <SyncButton /> : null}
            <Button asChild variant="ghost">
              <Link href="/cold-email/new">
                <Plus className="mr-1 h-4 w-4" />
                Add prospect
              </Link>
            </Button>
          </div>
        }
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <section className="grid gap-3 lg:grid-cols-4">
          <KpiCard
            label="Delivered (lifetime)"
            value={totals.delivered.toLocaleString("en-AE")}
            hint={`${allSeq.length} sequences`}
          />
          <KpiCard
            label="Open rate"
            value={`${(aggOpenRate * 100).toFixed(1)}%`}
            hint={`${totals.opened} opens`}
            tone={aggOpenRate >= 0.4 ? "success" : "default"}
          />
          <KpiCard
            label="Reply rate"
            value={`${(aggReplyRate * 100).toFixed(2)}%`}
            hint={`${totals.replied} replies`}
            tone={aggReplyRate >= 0.05 ? "success" : "default"}
          />
          <KpiCard
            label="Bounce rate"
            value={`${(aggBounceRate * 100).toFixed(2)}%`}
            hint={`${totals.bounced} bounces`}
            tone={aggBounceRate > 0.05 ? "danger" : "default"}
          />
        </section>

        <Tabs defaultValue="sequences">
          <TabsList>
            <TabsTrigger value="sequences">
              Sequences · {allSeq.length}
            </TabsTrigger>
            <TabsTrigger value="mailboxes">
              Mailboxes · {mailboxes?.length ?? 0}
            </TabsTrigger>
            <TabsTrigger value="prospects">
              Manual prospects · {prospects?.length ?? 0}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sequences" className="mt-6">
            {allSeq.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
                No Apollo sequences synced yet. Click &quot;Sync Apollo&quot;
                (admin) to pull the latest snapshot.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-line hover:bg-transparent">
                      <TableHead>Sequence</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Delivered</TableHead>
                      <TableHead className="text-right">Opened</TableHead>
                      <TableHead className="hidden md:table-cell text-right">
                        Replied
                      </TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        Clicked
                      </TableHead>
                      <TableHead className="hidden lg:table-cell text-right">
                        Bounced
                      </TableHead>
                      <TableHead className="hidden xl:table-cell text-right">
                        Last used
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {allSeq.map((s) => (
                      <SequenceRow key={s.id} sequence={s} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>

          <TabsContent value="mailboxes" className="mt-6">
            {!mailboxes || mailboxes.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
                No mailboxes synced. Connect a mailbox in Apollo, then sync.
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {mailboxes.map((m) => {
                  const lastSyncRel = m.last_synced_at_apollo
                    ? formatDistanceToNowStrict(
                        parseISO(m.last_synced_at_apollo),
                        { addSuffix: true },
                      )
                    : "never";
                  return (
                    <div
                      key={m.id}
                      className="rounded-xl border border-line bg-bg-2 p-5"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-start gap-2">
                          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-text-3" />
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm text-text">
                              {m.email}
                            </p>
                            <p className="text-xs text-text-3">
                              {m.provider}
                              {m.is_default ? " · default" : ""}
                            </p>
                          </div>
                        </div>
                        <StatusPill tone={m.active ? "success" : "muted"}>
                          {m.active ? "Active" : "Paused"}
                        </StatusPill>
                      </div>
                      <p className="mt-4 text-xs text-text-3">
                        Last Apollo sync · {lastSyncRel}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="prospects" className="mt-6">
            <p className="mb-4 text-xs text-text-3">
              {sent30} sent in the last 30 days · {replied30} replied. Use this
              for one-off, hand-personalized outreach that doesn&apos;t live in
              Apollo (e.g. the 5 founder pitches).
            </p>
            {!prospects || prospects.length === 0 ? (
              <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
                No prospects yet. Click &apos;Add prospect&apos; above.
              </p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
                <Table>
                  <TableHeader>
                    <TableRow className="border-line hover:bg-transparent">
                      <TableHead>Prospect</TableHead>
                      <TableHead className="hidden md:table-cell">Company</TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Subject
                      </TableHead>
                      <TableHead className="hidden lg:table-cell">
                        Sent
                      </TableHead>
                      {COLD_EMAIL_FLAGS.map((flag) => (
                        <TableHead key={flag} className="text-center">
                          {COLD_EMAIL_FLAG_LABELS[flag]}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {prospects.map((row) => (
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
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
