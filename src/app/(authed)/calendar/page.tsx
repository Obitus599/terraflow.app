import {
  format,
  formatDistanceToNowStrict,
  isPast,
  isToday,
  isTomorrow,
  parseISO,
} from "date-fns";
import { CalendarDays, MapPin, Pencil, Plus, Users } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import type { MeetingInput } from "@/lib/meetings/schema";
import { createClient } from "@/lib/supabase/server";

import { MeetingSheet } from "./_components/meeting-sheet";

export const metadata = { title: "Calendar" };

interface SearchParams {
  edit?: string;
  new?: string;
}

function localInputValue(iso: string): string {
  // Convert ISO timestamp from DB to the browser-local YYYY-MM-DDTHH:mm
  // format that <input type="datetime-local"> expects. Done client-side
  // by the form really, but we still need a serializable initial.
  const d = parseISO(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function bucketLabel(starts: Date): string {
  if (isToday(starts)) return "Today";
  if (isTomorrow(starts)) return "Tomorrow";
  if (isPast(starts)) return "Past";
  return format(starts, "EEEE, d MMM");
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: meetings },
    { data: profiles },
    { data: clients },
    { data: deals },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("meetings")
      .select(
        "id, title, description, starts_at, ends_at, location, attendees, pipeline_deal_id, client_id, owner_id, notes",
      )
      .order("starts_at", { ascending: true }),
    supabase.from("profiles").select("id, full_name").order("full_name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase
      .from("pipeline_deals")
      .select("id, prospect_name, company")
      .order("prospect_name")
      .limit(200),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin";
  const allMeetings = meetings ?? [];
  const ownerNamesById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name] as const),
  );
  const clientNamesById = new Map(
    (clients ?? []).map((c) => [c.id, c.name] as const),
  );
  const dealNamesById = new Map(
    (deals ?? []).map(
      (d) =>
        [
          d.id,
          d.company ? `${d.prospect_name} · ${d.company}` : d.prospect_name,
        ] as const,
    ),
  );

  const now = new Date();
  const upcoming = allMeetings.filter(
    (m) => parseISO(m.starts_at) >= now,
  );
  const past = allMeetings
    .filter((m) => parseISO(m.starts_at) < now)
    .reverse();

  // Group upcoming by date bucket
  const grouped = new Map<string, typeof allMeetings>();
  for (const m of upcoming) {
    const label = bucketLabel(parseISO(m.starts_at));
    const list = grouped.get(label) ?? [];
    list.push(m);
    grouped.set(label, list);
  }

  // Sheet state
  const editingMeeting = params.edit
    ? allMeetings.find((m) => m.id === params.edit) ?? null
    : null;
  const sheetMode: "create" | "edit" | "closed" =
    editingMeeting ? "edit" : params.new === "1" ? "create" : "closed";
  const sheetInitial: Partial<MeetingInput> | undefined = editingMeeting
    ? {
        title: editingMeeting.title,
        description: editingMeeting.description ?? "",
        starts_at: localInputValue(editingMeeting.starts_at),
        ends_at: localInputValue(editingMeeting.ends_at),
        location: editingMeeting.location ?? "",
        attendees: editingMeeting.attendees ?? "",
        pipeline_deal_id: editingMeeting.pipeline_deal_id ?? "",
        client_id: editingMeeting.client_id ?? "",
        notes: editingMeeting.notes ?? "",
      }
    : undefined;
  const canDeleteEditing =
    !!editingMeeting && (isAdmin || editingMeeting.owner_id === user!.id);

  return (
    <>
      <PageHeader
        eyebrow="Calendar"
        title="Meetings"
        description={`${upcoming.length} upcoming · ${past.length} past`}
        actions={
          <Button asChild>
            <Link href="/calendar?new=1">
              <Plus className="mr-1 h-4 w-4" />
              New meeting
            </Link>
          </Button>
        }
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        {upcoming.length === 0 ? (
          <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-12 text-center text-sm text-text-3">
            No upcoming meetings. Add one to start tracking.
          </p>
        ) : (
          Array.from(grouped.entries()).map(([label, items]) => (
            <section key={label}>
              <p className="section-label mb-3">{label}</p>
              <div className="space-y-2">
                {items.map((m) => (
                  <MeetingRow
                    key={m.id}
                    meeting={m}
                    ownerName={ownerNamesById.get(m.owner_id) ?? null}
                    clientName={
                      m.client_id
                        ? clientNamesById.get(m.client_id) ?? null
                        : null
                    }
                    dealName={
                      m.pipeline_deal_id
                        ? dealNamesById.get(m.pipeline_deal_id) ?? null
                        : null
                    }
                  />
                ))}
              </div>
            </section>
          ))
        )}

        {past.length > 0 ? (
          <section>
            <p className="section-label mb-3">Past · last {Math.min(past.length, 25)}</p>
            <div className="space-y-2 opacity-70">
              {past.slice(0, 25).map((m) => (
                <MeetingRow
                  key={m.id}
                  meeting={m}
                  ownerName={ownerNamesById.get(m.owner_id) ?? null}
                  clientName={
                    m.client_id
                      ? clientNamesById.get(m.client_id) ?? null
                      : null
                  }
                  dealName={
                    m.pipeline_deal_id
                      ? dealNamesById.get(m.pipeline_deal_id) ?? null
                      : null
                  }
                />
              ))}
            </div>
          </section>
        ) : null}
      </div>

      <MeetingSheet
        mode={sheetMode}
        meetingId={editingMeeting?.id}
        initial={sheetInitial}
        clients={clients ?? []}
        deals={deals ?? []}
        canDelete={canDeleteEditing}
      />
    </>
  );
}

function MeetingRow({
  meeting,
  ownerName,
  clientName,
  dealName,
}: {
  meeting: {
    id: string;
    title: string;
    starts_at: string;
    ends_at: string;
    location: string | null;
    attendees: string | null;
  };
  ownerName: string | null;
  clientName: string | null;
  dealName: string | null;
}) {
  const start = parseISO(meeting.starts_at);
  const end = parseISO(meeting.ends_at);
  const inPast = isPast(end);
  const startsRel = inPast
    ? `${formatDistanceToNowStrict(start, { addSuffix: true })}`
    : `in ${formatDistanceToNowStrict(start)}`;

  return (
    <Link
      href={`/calendar?edit=${meeting.id}`}
      className="group flex flex-col gap-3 rounded-xl border border-line bg-bg-2 px-5 py-4 transition-colors hover:border-text-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <CalendarDays className="h-4 w-4 shrink-0 text-text-3" />
          <p className="truncate text-sm text-text group-hover:text-accent">
            {meeting.title}
          </p>
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-text-3">
          <span>
            {format(start, "HH:mm")} – {format(end, "HH:mm")} · {startsRel}
          </span>
          {meeting.location ? (
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {meeting.location}
            </span>
          ) : null}
          {meeting.attendees ? (
            <span className="inline-flex items-center gap-1">
              <Users className="h-3 w-3" />
              {meeting.attendees.split(",").length} attendee(s)
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {clientName ? (
          <StatusPill tone="muted">{clientName}</StatusPill>
        ) : null}
        {dealName ? <StatusPill tone="accent">{dealName}</StatusPill> : null}
        {ownerName ? (
          <span className="text-xs text-text-3">{ownerName}</span>
        ) : null}
        <Pencil className="h-3.5 w-3.5 text-text-4" />
      </div>
    </Link>
  );
}
