import { ChevronLeft } from "lucide-react";
import Link from "next/link";

import { PageHeader } from "@/components/page-header";
import { createClient } from "@/lib/supabase/server";

import { TaskForm } from "../_components/task-form";

export const metadata = { title: "New task" };

export default async function NewTaskPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: profiles }, { data: clients }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name")
      .order("full_name"),
    supabase.from("clients").select("id, name").order("name"),
  ]);

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
        title="New task"
      />
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="max-w-2xl">
          <TaskForm
            mode="create"
            owners={profiles ?? []}
            clients={clients ?? []}
            initial={{ owner_id: user!.id }}
            canDelete={false}
          />
        </div>
      </div>
    </>
  );
}
