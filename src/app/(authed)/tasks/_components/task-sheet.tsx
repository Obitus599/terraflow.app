"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { TaskInput } from "@/lib/tasks/schema";

import { TaskForm } from "./task-form";

interface TaskSheetProps {
  mode: "create" | "edit" | "closed";
  taskId?: string;
  initial?: Partial<TaskInput>;
  owners: { id: string; full_name: string }[];
  clients: { id: string; name: string }[];
  canDelete: boolean;
}

const MANAGED_PARAMS = ["edit", "new", "highlight"];

export function TaskSheet({
  mode,
  taskId,
  initial,
  owners,
  clients,
  canDelete,
}: TaskSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const open = mode !== "closed";

  function close() {
    const next = new URLSearchParams(params.toString());
    for (const k of MANAGED_PARAMS) next.delete(k);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-line bg-bg-2 sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-text">
            {mode === "create" ? "New task" : "Edit task"}
          </SheetTitle>
          <SheetDescription className="text-text-3">
            {mode === "create"
              ? "Adds a task to the queue. Owner defaults to you."
              : "Changes save in place — closing the sheet returns to your filtered view."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-1">
          {open ? (
            <TaskForm
              mode={mode === "create" ? "create" : "edit"}
              taskId={taskId}
              owners={owners}
              clients={clients}
              initial={initial}
              canDelete={canDelete}
              onSuccess={close}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
