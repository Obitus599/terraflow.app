import { z } from "zod";

export const TASK_STATUSES = [
  "not_started",
  "in_progress",
  "blocked",
  "done",
] as const;

export const TASK_PRIORITIES = ["p0", "p1", "p2"] as const;

export const TASK_STATUS_LABELS: Record<(typeof TASK_STATUSES)[number], string> = {
  not_started: "Not started",
  in_progress: "In progress",
  blocked: "Blocked",
  done: "Done",
};

export const TASK_STATUS_TONE: Record<
  (typeof TASK_STATUSES)[number],
  "muted" | "warning" | "danger" | "success"
> = {
  not_started: "muted",
  in_progress: "warning",
  blocked: "danger",
  done: "success",
};

export const TASK_PRIORITY_LABELS: Record<
  (typeof TASK_PRIORITIES)[number],
  string
> = {
  p0: "P0",
  p1: "P1",
  p2: "P2",
};

export const TASK_PRIORITY_TONE: Record<
  (typeof TASK_PRIORITIES)[number],
  "danger" | "warning" | "muted"
> = {
  p0: "danger",
  p1: "warning",
  p2: "muted",
};

// Empty strings normalized in the action.
export const taskSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  owner_id: z.string().min(1, "Owner is required"),
  client_id: z.string().optional(),
  status: z.enum(TASK_STATUSES),
  priority: z.enum(TASK_PRIORITIES),
  due_date: z.string().optional(),
  estimated_hours: z
    .number({ message: "Enter a number" })
    .nonnegative(),
  actual_hours: z
    .number({ message: "Enter a number" })
    .nonnegative(),
  notes: z.string().optional(),
  category: z.string().optional(),
});

export type TaskInput = z.infer<typeof taskSchema>;
