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
import { GripVertical } from "lucide-react";
import Link from "next/link";
import { useOptimistic, useTransition } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/status-pill";
import { formatAedCompact, initialsOf } from "@/lib/format";
import { updateDealStage } from "@/lib/pipeline/actions";
import {
  ACTIVE_STAGES,
  CONFIDENCE_LABELS,
  CONFIDENCE_TONE,
  SOURCE_LABELS,
  STAGE_LABELS,
} from "@/lib/pipeline/schema";
import { cn } from "@/lib/utils";

type Stage = (typeof ACTIVE_STAGES)[number];

export interface KanbanDeal {
  id: string;
  prospect_name: string;
  company: string | null;
  stage: string;
  source: string;
  confidence: string;
  expected_aed_monthly: number;
  owner_id: string | null;
  next_action: string | null;
}

interface KanbanBoardProps {
  deals: KanbanDeal[];
  ownerNamesById: Record<string, string>;
}

export function KanbanBoard({ deals, ownerNamesById }: KanbanBoardProps) {
  const [optimistic, setOptimistic] = useOptimistic(
    deals,
    (state, { id, stage }: { id: string; stage: Stage }) =>
      state.map((d) => (d.id === id ? { ...d, stage } : d)),
  );
  const [, startTransition] = useTransition();
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const dealId = String(active.id);
    const newStage = String(over.id) as Stage;
    if (!ACTIVE_STAGES.includes(newStage)) return;
    const deal = optimistic.find((d) => d.id === dealId);
    if (!deal || deal.stage === newStage) return;

    startTransition(async () => {
      setOptimistic({ id: dealId, stage: newStage });
      const result = await updateDealStage(dealId, newStage);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <DndContext sensors={sensors} onDragEnd={onDragEnd}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {ACTIVE_STAGES.map((stage) => (
          <Column
            key={stage}
            stage={stage}
            deals={optimistic.filter((d) => d.stage === stage)}
            ownerNamesById={ownerNamesById}
          />
        ))}
      </div>
    </DndContext>
  );
}

function Column({
  stage,
  deals,
  ownerNamesById,
}: {
  stage: Stage;
  deals: KanbanDeal[];
  ownerNamesById: Record<string, string>;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: stage });
  const total = deals.reduce((s, d) => s + d.expected_aed_monthly, 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex h-full w-[280px] shrink-0 flex-col rounded-xl border bg-bg-2 transition-colors",
        isOver ? "border-accent/40 bg-accent/5" : "border-line",
      )}
    >
      <div className="flex items-baseline justify-between border-b border-line px-4 py-3">
        <h3 className="font-display text-sm font-medium text-text">
          {STAGE_LABELS[stage]}
        </h3>
        <span className="text-xs text-text-3">
          {deals.length} · {formatAedCompact(total)}
        </span>
      </div>
      <div className="flex-1 space-y-2 p-3 min-h-[12rem]">
        {deals.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line py-6 text-center text-xs text-text-4">
            Drop here
          </p>
        ) : (
          deals.map((d) => (
            <DealCard
              key={d.id}
              deal={d}
              ownerName={d.owner_id ? ownerNamesById[d.owner_id] : null}
            />
          ))
        )}
      </div>
    </div>
  );
}

function DealCard({
  deal,
  ownerName,
}: {
  deal: KanbanDeal;
  ownerName: string | null;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({ id: deal.id });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "group rounded-lg border border-line bg-bg-3 p-3 text-left",
        isDragging && "opacity-60 shadow-none",
      )}
    >
      <div className="flex items-start gap-2">
        <button
          type="button"
          {...listeners}
          {...attributes}
          className="cursor-grab text-text-4 hover:text-text-2 active:cursor-grabbing"
          aria-label="Drag deal"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <Link
            href={`/pipeline/${deal.id}/edit`}
            className="block min-w-0"
          >
            <p className="truncate text-sm font-medium text-text group-hover:text-accent">
              {deal.prospect_name}
            </p>
            {deal.company ? (
              <p className="truncate text-xs text-text-3">{deal.company}</p>
            ) : null}
          </Link>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <span className="font-display text-base text-text">
          {formatAedCompact(deal.expected_aed_monthly)}
          <span className="ml-1 text-[10px] text-text-3">/mo</span>
        </span>
        <StatusPill
          tone={
            CONFIDENCE_TONE[
              deal.confidence as keyof typeof CONFIDENCE_TONE
            ]
          }
        >
          {CONFIDENCE_LABELS[deal.confidence as keyof typeof CONFIDENCE_LABELS]}
        </StatusPill>
      </div>

      <div className="mt-3 flex items-center justify-between text-[11px] text-text-3">
        <span>
          {SOURCE_LABELS[deal.source as keyof typeof SOURCE_LABELS] ??
            deal.source}
        </span>
        {ownerName ? (
          <span className="grid h-5 w-5 place-items-center rounded-full bg-bg-2 text-[10px] text-text-2">
            {initialsOf(ownerName)}
          </span>
        ) : null}
      </div>

      {deal.next_action ? (
        <p className="mt-2 line-clamp-1 border-t border-line pt-2 text-[11px] text-text-3">
          → {deal.next_action}
        </p>
      ) : null}
    </div>
  );
}
