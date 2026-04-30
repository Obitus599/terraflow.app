"use client";

import { ChevronDown, Loader2 } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/status-pill";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateTaskStatus } from "@/lib/tasks/actions";
import {
  TASK_STATUSES,
  TASK_STATUS_LABELS,
  TASK_STATUS_TONE,
} from "@/lib/tasks/schema";

type TaskStatus = (typeof TASK_STATUSES)[number];

interface TaskStatusCellProps {
  taskId: string;
  status: TaskStatus;
  canEdit: boolean;
}

export function TaskStatusCell({ taskId, status, canEdit }: TaskStatusCellProps) {
  const [isPending, startTransition] = useTransition();
  const tone = TASK_STATUS_TONE[status];
  const label = TASK_STATUS_LABELS[status];

  if (!canEdit) {
    return <StatusPill tone={tone}>{label}</StatusPill>;
  }

  function onSelect(newStatus: TaskStatus) {
    if (newStatus === status) return;
    startTransition(async () => {
      const result = await updateTaskStatus(taskId, newStatus);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="inline-flex items-center gap-1.5 rounded-full focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent disabled:opacity-60"
      >
        <StatusPill tone={tone}>{label}</StatusPill>
        {isPending ? (
          <Loader2 className="h-3 w-3 animate-spin text-text-3" />
        ) : (
          <ChevronDown className="h-3 w-3 text-text-3" />
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-44">
        {TASK_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s}
            onSelect={() => onSelect(s)}
            disabled={s === status}
          >
            {TASK_STATUS_LABELS[s]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
