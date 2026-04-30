import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";
import type { TaskInput } from "@/lib/tasks/schema";

import { TaskForm } from "../../_components/task-form";

export const metadata = { title: "Edit task" };

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: task }, { data: profiles }, { data: clients }, { data: profile }] =
    await Promise.all([
      supabase
        .from("tasks")
        .select(
          "id, title, owner_id, client_id, status, priority, due_date, estimated_hours, actual_hours, notes, category",
        )
        .eq("id", id)
        .maybeSingle(),
      supabase
        .from("profiles")
        .select("id, full_name")
        .order("full_name"),
      supabase.from("clients").select("id, name").order("name"),
      supabase
        .from("profiles")
        .select("role")
        .eq("id", user!.id)
        .maybeSingle(),
    ]);

  if (!task) notFound();

  const initial: Partial<TaskInput> = {
    title: task.title,
    owner_id: task.owner_id,
    client_id: task.client_id ?? "",
    status: task.status as TaskInput["status"],
    priority: task.priority as TaskInput["priority"],
    due_date: task.due_date ?? "",
    estimated_hours: Number(task.estimated_hours),
    actual_hours: Number(task.actual_hours),
    notes: task.notes ?? "",
    category: task.category ?? "",
  };

  const isAdmin = profile?.role === "admin";

  return (
    <>
      <PageHeader
        eyebrow={
          <Link
            href="/tasks"
            className="inline-flex items-center gap-1 text-xs uppercase tracking-[0.18em] text-text-3 hover:text-text"
          >
            <ChevronLeft className="h-3 w-3" />
            Tasks
          </Link>
        }
        title="Edit task"
        description={task.title}
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <TaskForm
            mode="edit"
            taskId={task.id}
            owners={profiles ?? []}
            clients={clients ?? []}
            initial={initial}
            canDelete={isAdmin}
          />
        </div>
      </div>
    </>
  );
}
