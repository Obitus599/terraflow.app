import { ChevronLeft, Pencil } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
} from "@/lib/clients/schema";
import { formatAed } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const HEALTH_DOT: Record<string, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  paused: "warning",
  churned: "danger",
  pending: "muted",
};

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [
    { data: client },
    { data: tasks },
    { data: revenue },
    { data: profile },
  ] = await Promise.all([
    supabase
      .from("clients")
      .select(
        "id, name, client_type, monthly_aed, status, health, start_date, upsell_ideas, notes",
      )
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("tasks")
      .select("id, title, status, priority, due_date, owner_id")
      .eq("client_id", id)
      .order("due_date", { ascending: true })
      .limit(50),
    supabase
      .from("revenue_entries")
      .select("id, received_date, amount_aed, invoice_number, entry_type")
      .eq("client_id", id)
      .order("received_date", { ascending: false })
      .limit(50),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  if (!client) notFound();

  const isAdmin = profile?.role === "admin";
  const tone = STATUS_TONE[client.status] ?? "muted";
  const totalRevenue = (revenue ?? []).reduce(
    (sum, r) => sum + (r.amount_aed ?? 0),
    0,
  );

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/clients"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Clients
          </Link>
        }
        title={client.name}
        description={
          CLIENT_TYPE_LABELS[
            client.client_type as keyof typeof CLIENT_TYPE_LABELS
          ] ?? client.client_type
        }
        actions={
          isAdmin ? (
            <Button variant="secondary" asChild>
              <Link href={`/clients/${client.id}/edit`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          ) : null
        }
      />

      <div className="space-y-8 px-6 py-6 md:px-10 md:py-8">
        <div className="flex flex-wrap items-center gap-3">
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border border-line bg-bg-2 px-3 py-1 text-xs",
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                HEALTH_DOT[client.health] ?? "bg-text-4",
              )}
            />
            <span className="text-text-3">Health</span>
            <span className="text-text capitalize">{client.health}</span>
          </span>
          <StatusPill tone={tone}>
            {CLIENT_STATUS_LABELS[
              client.status as keyof typeof CLIENT_STATUS_LABELS
            ] ?? client.status}
          </StatusPill>
          <span className="text-text-3">
            <span className="font-display text-lg text-text">
              {formatAed(client.monthly_aed)}
            </span>
            <span className="ml-1 text-xs text-text-3">/ month</span>
          </span>
        </div>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tasks">
              Tasks {tasks?.length ? `· ${tasks.length}` : ""}
            </TabsTrigger>
            <TabsTrigger value="revenue">
              Revenue {revenue?.length ? `· ${revenue.length}` : ""}
            </TabsTrigger>
            <TabsTrigger value="notes">Notes</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-3">
            <DetailRow
              label="Start date"
              value={client.start_date ?? "—"}
            />
            <DetailRow
              label="Lifetime revenue"
              value={formatAed(totalRevenue)}
            />
            <DetailRow
              label="Open tasks"
              value={String(
                (tasks ?? []).filter((t) => t.status !== "done").length,
              )}
            />
          </TabsContent>

          <TabsContent value="tasks" className="mt-6">
            {tasks && tasks.length > 0 ? (
              <ul className="divide-y divide-line rounded-xl border border-line bg-bg-2">
                {tasks.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm text-text">{t.title}</p>
                      <p className="text-xs text-text-3">
                        {t.priority.toUpperCase()} ·{" "}
                        {t.due_date ?? "no due date"}
                      </p>
                    </div>
                    <span className="text-xs uppercase tracking-wider text-text-3">
                      {t.status.replace("_", " ")}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty label="No tasks linked to this client yet." />
            )}
          </TabsContent>

          <TabsContent value="revenue" className="mt-6">
            {revenue && revenue.length > 0 ? (
              <ul className="divide-y divide-line rounded-xl border border-line bg-bg-2">
                {revenue.map((r) => (
                  <li
                    key={r.id}
                    className="flex items-center justify-between px-4 py-3"
                  >
                    <div>
                      <p className="text-sm text-text">
                        {r.invoice_number ?? "(no invoice #)"}
                      </p>
                      <p className="text-xs text-text-3">
                        {r.received_date} · {r.entry_type}
                      </p>
                    </div>
                    <span className="font-display text-sm text-text">
                      {formatAed(r.amount_aed)}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <Empty label="No revenue logged for this client yet." />
            )}
          </TabsContent>

          <TabsContent value="notes" className="mt-6 space-y-4">
            <NotesBlock label="Notes" body={client.notes} />
            <NotesBlock label="Upsell ideas" body={client.upsell_ideas} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between border-b border-line-2 py-2">
      <span className="text-xs uppercase tracking-[0.18em] text-text-3">
        {label}
      </span>
      <span className="text-sm text-text">{value}</span>
    </div>
  );
}

function NotesBlock({
  label,
  body,
}: {
  label: string;
  body: string | null;
}) {
  return (
    <div className="rounded-xl border border-line bg-bg-2 p-5">
      <p className="section-label mb-3">{label}</p>
      {body ? (
        <p className="whitespace-pre-wrap text-sm text-text-2">{body}</p>
      ) : (
        <p className="text-sm text-text-4">Nothing yet.</p>
      )}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <p className="rounded-xl border border-dashed border-line bg-bg-2 px-4 py-8 text-center text-sm text-text-3">
      {label}
    </p>
  );
}
