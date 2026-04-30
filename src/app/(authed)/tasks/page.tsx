import { addDays, format, startOfToday } from "date-fns";
import { Pencil, Plus } from "lucide-react";
import Link from "next/link";

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
import { initialsOf } from "@/lib/format";
import { createClient } from "@/lib/supabase/server";
import {
  TASK_PRIORITY_LABELS,
  TASK_PRIORITY_TONE,
} from "@/lib/tasks/schema";
import { cn } from "@/lib/utils";

import { TaskFilters } from "./_components/task-filters";
import { TaskStatusCell } from "./_components/task-status-cell";

export const metadata = { title: "Tasks" };

interface SearchParams {
  q?: string;
  status?: string;
  priority?: string;
  owner?: string;
  client?: string;
  due?: string;
  highlight?: string;
}

export default async function TasksPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const today = startOfToday();
  const weekFromNow = addDays(today, 7);

  let query = supabase
    .from("tasks")
    .select(
      "id, title, status, priority, due_date, estimated_hours, actual_hours, client_id, owner_id, category, created_at",
    );

  if (params.q && params.q.trim().length > 0) {
    query = query.ilike("title", `%${params.q.trim()}%`);
  }
  if (params.status) query = query.eq("status", params.status);
  if (params.priority) query = query.eq("priority", params.priority);
  if (params.owner) query = query.eq("owner_id", params.owner);
  if (params.client) query = query.eq("client_id", params.client);
  if (params.due === "overdue") {
    query = query
      .lt("due_date", format(today, "yyyy-MM-dd"))
      .neq("status", "done");
  } else if (params.due === "this_week") {
    query = query
      .gte("due_date", format(today, "yyyy-MM-dd"))
      .lte("due_date", format(weekFromNow, "yyyy-MM-dd"));
  } else if (params.due === "no_due") {
    query = query.is("due_date", null);
  }

  const [
    { data: tasks, error },
    { data: profiles },
    { data: clients },
    { data: profile },
  ] = await Promise.all([
    query
      .order("priority", { ascending: true })
      .order("due_date", { ascending: true, nullsFirst: false })
      .limit(500),
    supabase
      .from("profiles")
      .select("id, full_name, role")
      .order("full_name"),
    supabase.from("clients").select("id, name").order("name"),
    supabase
      .from("profiles")
      .select("role")
      .eq("id", user!.id)
      .maybeSingle(),
  ]);

  const isAdmin = profile?.role === "admin";
  const ownersById = new Map(
    (profiles ?? []).map((p) => [p.id, p.full_name] as const),
  );
  const clientsById = new Map(
    (clients ?? []).map((c) => [c.id, c.name] as const),
  );

  const counts = {
    open: (tasks ?? []).filter((t) => t.status !== "done").length,
    overdue: (tasks ?? []).filter(
      (t) =>
        t.due_date &&
        t.due_date < format(today, "yyyy-MM-dd") &&
        t.status !== "done",
    ).length,
    blocked: (tasks ?? []).filter((t) => t.status === "blocked").length,
  };

  return (
    <>
      <PageHeader
        eyebrow="Tasks"
        title="Work queue"
        description={`${counts.open} open · ${counts.overdue} overdue · ${counts.blocked} blocked`}
        actions={
          <Button asChild>
            <Link href="/tasks/new">
              <Plus className="mr-1 h-4 w-4" />
              New task
            </Link>
          </Button>
        }
      />

      <div className="flex flex-col gap-6 px-6 py-6 md:px-10 md:py-8">
        <TaskFilters
          owners={(profiles ?? []).map((p) => ({
            id: p.id,
            full_name: p.full_name,
          }))}
          clients={clients ?? []}
        />

        {error ? (
          <p className="rounded-md border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">
            Failed to load tasks: {error.message}
          </p>
        ) : !tasks || tasks.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
            <Table>
              <TableHeader>
                <TableRow className="border-line hover:bg-transparent">
                  <TableHead>Task</TableHead>
                  <TableHead className="hidden md:table-cell">Client</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden sm:table-cell">Priority</TableHead>
                  <TableHead className="hidden lg:table-cell">Due</TableHead>
                  <TableHead className="hidden xl:table-cell">Est hrs</TableHead>
                  <TableHead className="w-12 text-right" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {tasks.map((t) => {
                  const owner = ownersById.get(t.owner_id);
                  const isMine = t.owner_id === user!.id;
                  const canEditStatus = isMine || isAdmin;
                  const isOverdue =
                    t.due_date &&
                    t.due_date < format(today, "yyyy-MM-dd") &&
                    t.status !== "done";
                  const highlighted = params.highlight === t.id;

                  return (
                    <TableRow
                      key={t.id}
                      className={cn(
                        "border-line",
                        highlighted && "bg-accent/5",
                      )}
                    >
                      <TableCell className="max-w-[280px]">
                        <p className="truncate text-sm text-text">{t.title}</p>
                        {t.category ? (
                          <p className="text-xs text-text-3">{t.category}</p>
                        ) : null}
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-text-2">
                        {t.client_id ? clientsById.get(t.client_id) ?? "—" : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-bg-3 text-[10px] text-text-2">
                            {initialsOf(owner)}
                          </span>
                          <span className="hidden text-sm text-text-2 md:inline">
                            {owner ?? "—"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TaskStatusCell
                          taskId={t.id}
                          status={t.status as "not_started" | "in_progress" | "blocked" | "done"}
                          canEdit={canEditStatus}
                        />
                      </TableCell>
                      <TableCell className="hidden sm:table-cell">
                        <StatusPill
                          tone={
                            TASK_PRIORITY_TONE[
                              t.priority as "p0" | "p1" | "p2"
                            ]
                          }
                        >
                          {
                            TASK_PRIORITY_LABELS[
                              t.priority as "p0" | "p1" | "p2"
                            ]
                          }
                        </StatusPill>
                      </TableCell>
                      <TableCell
                        className={cn(
                          "hidden lg:table-cell text-sm",
                          isOverdue ? "text-danger" : "text-text-2",
                        )}
                      >
                        {t.due_date ?? "—"}
                      </TableCell>
                      <TableCell className="hidden xl:table-cell text-sm text-text-2">
                        {Number(t.estimated_hours) || "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button asChild variant="ghost" size="sm">
                          <Link href={`/tasks/${t.id}/edit`}>
                            <Pencil className="h-3.5 w-3.5" />
                            <span className="sr-only">Edit</span>
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-line bg-bg-2 px-6 py-16 text-center">
      <p className="font-display text-base text-text">No tasks match these filters</p>
      <p className="mt-1 max-w-sm text-sm text-text-3">
        Adjust the filters above, or add a new task to get the team moving.
      </p>
      <Button asChild className="mt-6">
        <Link href="/tasks/new">
          <Plus className="mr-1 h-4 w-4" />
          New task
        </Link>
      </Button>
    </div>
  );
}
