"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { addTask, deleteTask, updateTask } from "@/lib/tasks/actions";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  taskSchema,
  type TaskInput,
} from "@/lib/tasks/schema";

interface TaskFormProps {
  mode: "create" | "edit";
  taskId?: string;
  initial?: Partial<TaskInput>;
  owners: { id: string; full_name: string }[];
  clients: { id: string; name: string }[];
  canDelete: boolean;
}

const NONE = "__none__";

export function TaskForm({
  mode,
  taskId,
  initial,
  owners,
  clients,
  canDelete,
}: TaskFormProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const form = useForm<TaskInput>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: initial?.title ?? "",
      owner_id: initial?.owner_id ?? owners[0]?.id ?? "",
      client_id: initial?.client_id ?? "",
      status: initial?.status ?? "not_started",
      priority: initial?.priority ?? "p1",
      due_date: initial?.due_date ?? "",
      estimated_hours: initial?.estimated_hours ?? 0,
      actual_hours: initial?.actual_hours ?? 0,
      notes: initial?.notes ?? "",
      category: initial?.category ?? "",
    },
  });

  const watchedOwner = useWatch({ control: form.control, name: "owner_id" });
  const watchedClient = useWatch({ control: form.control, name: "client_id" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });
  const watchedPriority = useWatch({ control: form.control, name: "priority" });

  function onSubmit(values: TaskInput) {
    startSaving(async () => {
      const result =
        mode === "create"
          ? await addTask(values)
          : await updateTask(taskId!, values);

      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof TaskInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
        return;
      }

      toast.success(mode === "create" ? "Task created" : "Task updated");
      if (mode === "edit") {
        router.push("/tasks");
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!taskId) return;
    if (!confirm("Delete this task? This can't be undone.")) return;
    startDeleting(async () => {
      const result = await deleteTask(taskId);
      if (!result.ok) toast.error(result.message);
    });
  }

  const pending = isSaving || isDeleting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" autoComplete="off" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-xs text-danger">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="owner_id">Owner</Label>
          <Select
            value={watchedOwner}
            onValueChange={(v) => form.setValue("owner_id", v)}
          >
            <SelectTrigger id="owner_id">
              <SelectValue placeholder="Select owner" />
            </SelectTrigger>
            <SelectContent>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {form.formState.errors.owner_id ? (
            <p className="text-xs text-danger">
              {form.formState.errors.owner_id.message}
            </p>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <Select
            value={watchedClient || NONE}
            onValueChange={(v) =>
              form.setValue("client_id", v === NONE ? "" : v)
            }
          >
            <SelectTrigger id="client_id">
              <SelectValue placeholder="(internal)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>(internal — no client)</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watchedStatus}
            onValueChange={(v) =>
              form.setValue("status", v as TaskInput["status"])
            }
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="priority">Priority</Label>
          <Select
            value={watchedPriority}
            onValueChange={(v) =>
              form.setValue("priority", v as TaskInput["priority"])
            }
          >
            <SelectTrigger id="priority">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TASK_PRIORITIES.map((p) => (
                <SelectItem key={p} value={p}>
                  {TASK_PRIORITY_LABELS[p]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" type="date" {...form.register("due_date")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="estimated_hours">Est hrs</Label>
          <Input
            id="estimated_hours"
            type="number"
            min={0}
            step={0.25}
            {...form.register("estimated_hours", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="actual_hours">Actual hrs</Label>
          <Input
            id="actual_hours"
            type="number"
            min={0}
            step={0.25}
            {...form.register("actual_hours", { valueAsNumber: true })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="category">Category</Label>
          <Input
            id="category"
            placeholder="e.g. Vortex SEO"
            {...form.register("category")}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} {...form.register("notes")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {mode === "edit" && canDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            disabled={pending}
            className="text-danger hover:text-danger"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {isSaving
              ? "Saving…"
              : mode === "create"
                ? "Create task"
                : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
