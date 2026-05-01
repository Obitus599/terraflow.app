"use client";

import {
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Award, GripVertical, X } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/status-pill";
import { formatAedCompact, initialsOf } from "@/lib/format";
import { moveRunToStage } from "@/lib/funnels/actions";
import { cn } from "@/lib/utils";

export interface KanbanStage {
  id: string;
  name: string;
  sort_order: number;
  is_terminal_won: boolean;
  is_terminal_lost: boolean;
}

export interface KanbanRun {
  id: string;
  current_stage_id: string | null;
  outcome: string;
  prospect_name: string | null;
  company: string | null;
  expected_aed_monthly: number;
  owner_id: string | null;
}

interface FunnelKanbanProps {
  stages: KanbanStage[];
  runs: KanbanRun[];
  ownerNamesById: Record<string, string>;
}

export function FunnelKanban({
  stages,
  runs,
  ownerNamesById,
}: FunnelKanbanProps) {
  const [optimistic, setOptimistic] = useOptimistic(
    runs,
    (state, { id, stageId }: { id: string; stageId: string }) =>
      state.map((r) =>
        r.id === id ? { ...r, current_stage_id: stageId } : r,
      ),
  );
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const runId = String(active.id);
    const stageId = String(over.id);
    const run = optimistic.find((r) => r.id === runId);
    if (!run || run.current_stage_id === stageId) return;

    startTransition(async () => {
      setOptimistic({ id: runId, stageId });
      const result = await moveRunToStage(runId, stageId);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {stages
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((stage) => {
            const stageRuns = optimistic.filter(
              (r) => r.current_stage_id === stage.id,
            );
            return (
              <Column
                key={stage.id}
                stage={stage}
                runs={stageRuns}
                ownerNamesById={ownerNamesById}
              />
            );
          })}
      </div>
    </DndContext>
  );
}

function Column({
  stage,
  runs,
  ownerNamesById,
}: {
  stage: KanbanStage;
  runs: KanbanRun[];
  ownerNamesById: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = runs.reduce((s, r) => s + r.expected_aed_monthly, 0);

  const tone = stage.is_terminal_won
    ? "border-success/40"
    : stage.is_terminal_lost
      ? "border-danger/40"
      : isOver
        ? "border-accent/40 bg-accent/5"
        : "border-line";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col rounded-xl border bg-bg-2 transition-colors",
        tone,
      )}
    >
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h3 className="flex items-center gap-1.5 font-display text-sm font-medium text-text">
          {stage.is_terminal_won ? (
            <Award className="h-3.5 w-3.5 text-success" />
          ) : null}
          {stage.is_terminal_lost ? (
            <X className="h-3.5 w-3.5 text-danger" />
          ) : null}
          {stage.name}
        </h3>
        <span className="text-xs text-text-3">
          {runs.length} · {formatAedCompact(total)}
        </span>
      </div>
      <div className="flex-1 space-y-2 p-3 min-h-[12rem]">
        {runs.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-text-4">
            Drop here
          </p>
        ) : (
          runs.map((r) => (
            <RunCard
              key={r.id}
              run={r}
              ownerName={r.owner_id ? ownerNamesById[r.owner_id] : null}
            />
          ))
        )}
      </div>
    </div>
  );
}

function RunCard({
  run,
  ownerName,
}: {
  run: KanbanRun;
  ownerName: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: run.id });

  const style = { transform: CSS.Translate.toString(transform) };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border border-line bg-bg-3 p-3 text-left",
        isDragging && "opacity-60",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="cursor-grab text-text-4 hover:text-text-2 active:cursor-grabbing"
          aria-label="Drag prospect"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Link
            href={`/pipeline?edit=${run.id}`}
            className="block min-w-0"
          >
            <p className="truncate text-sm font-medium text-text group-hover:text-accent">
              {run.prospect_name ?? "(unknown)"}
            </p>
            {run.company ? (
              <p className="truncate text-xs text-text-3">{run.company}</p>
            ) : null}
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="font-display text-base text-text">
          {formatAedCompact(run.expected_aed_monthly)}
          <span className="ml-1 text-[10px] text-text-3">/mo</span>
        </span>
        {ownerName ? (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-bg-2 text-[10px] text-text-2">
            {initialsOf(ownerName)}
          </span>
        ) : null}
      </div>

      {run.outcome !== "in_progress" ? (
        <p className="mt-2 border-t border-line pt-2">
          <StatusPill
            tone={
              run.outcome === "won"
                ? "success"
                : run.outcome === "lost"
                  ? "danger"
                  : "muted"
            }
          >
            {run.outcome}
          </StatusPill>
        </p>
      ) : null}
    </div>
  );
}
