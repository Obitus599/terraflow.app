"use client";

import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Award, GripVertical, Plus, Trash, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addStage,
  deleteStage,
  reorderStages,
  updateStage,
} from "@/lib/funnels/actions";
import type { StageInput } from "@/lib/funnels/schema";

interface StageEditorProps {
  funnelId: string;
  initial: Stage[];
}

interface Stage {
  id: string;
  name: string;
  sort_order: number;
  target_conversion_pct: number;
  target_days: number;
  is_terminal_won: boolean;
  is_terminal_lost: boolean;
}

export function StageEditor({ funnelId, initial }: StageEditorProps) {
  const [stages, setStages] = useState<Stage[]>(initial);
  const [, startTransition] = useTransition();

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;

    const next = arrayMove(stages, oldIndex, newIndex).map((s, i) => ({
      ...s,
      sort_order: i,
    }));
    setStages(next);

    startTransition(async () => {
      const result = await reorderStages(
        funnelId,
        next.map((s) => s.id),
      );
      if (!result.ok) {
        toast.error(result.message);
        setStages(stages); // rollback
      }
    });
  }

  function onAdd() {
    startTransition(async () => {
      const result = await addStage(funnelId, {
        name: "New stage",
        target_conversion_pct: 0,
        target_days: 0,
        is_terminal_won: false,
        is_terminal_lost: false,
      });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Stage added");
    });
  }

  function onSaveStage(stageId: string, updated: StageInput) {
    startTransition(async () => {
      const result = await updateStage(stageId, updated);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setStages((cur) =>
        cur.map((s) =>
          s.id === stageId
            ? {
                ...s,
                name: updated.name,
                target_conversion_pct: updated.target_conversion_pct,
                target_days: updated.target_days,
                is_terminal_won: updated.is_terminal_won,
                is_terminal_lost: updated.is_terminal_lost,
              }
            : s,
        ),
      );
      toast.success("Stage updated");
    });
  }

  function onDelete(stageId: string) {
    if (!confirm("Delete this stage? Runs currently in it will be unassigned.")) return;
    startTransition(async () => {
      const result = await deleteStage(stageId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      setStages((cur) => cur.filter((s) => s.id !== stageId));
      toast.success("Stage deleted");
    });
  }

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={onDragEnd}
      >
        <SortableContext
          items={stages.map((s) => s.id)}
          strategy={verticalListSortingStrategy}
        >
          {stages.map((stage) => (
            <SortableStage
              key={stage.id}
              stage={stage}
              onSave={(s) => onSaveStage(stage.id, s)}
              onDelete={() => onDelete(stage.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      <Button type="button" variant="secondary" onClick={onAdd}>
        <Plus className="mr-1 h-4 w-4" />
        Add stage
      </Button>
    </div>
  );
}

function SortableStage({
  stage,
  onSave,
  onDelete,
}: {
  stage: Stage;
  onSave: (s: StageInput) => void;
  onDelete: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
  };

  const [name, setName] = useState(stage.name);
  const [pctText, setPctText] = useState(
    (stage.target_conversion_pct * 100).toFixed(1),
  );
  const [days, setDays] = useState(stage.target_days);
  const [terminalWon, setTerminalWon] = useState(stage.is_terminal_won);
  const [terminalLost, setTerminalLost] = useState(stage.is_terminal_lost);

  const dirty =
    name !== stage.name ||
    Math.abs(parseFloat(pctText) / 100 - stage.target_conversion_pct) > 1e-6 ||
    days !== stage.target_days ||
    terminalWon !== stage.is_terminal_won ||
    terminalLost !== stage.is_terminal_lost;

  function save() {
    const pct = parseFloat(pctText);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return;
    }
    onSave({
      name: name.trim(),
      target_conversion_pct: pct / 100,
      target_days: days,
      is_terminal_won: terminalWon,
      is_terminal_lost: terminalLost,
    });
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-3 rounded-xl border border-line bg-bg-2 p-4"
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        className="mt-1.5 cursor-grab text-text-4 hover:text-text-2 active:cursor-grabbing"
        aria-label="Drag to reorder"
      >
        <GripVertical className="h-4 w-4" />
      </button>

      <div className="grid flex-1 gap-3 sm:grid-cols-[1fr_120px_120px_auto]">
        <div className="space-y-1">
          <Label htmlFor={`name-${stage.id}`} className="text-xs text-text-3">
            Stage name
          </Label>
          <Input
            id={`name-${stage.id}`}
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`pct-${stage.id}`} className="text-xs text-text-3">
            Target conversion %
          </Label>
          <Input
            id={`pct-${stage.id}`}
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={pctText}
            onChange={(e) => setPctText(e.target.value)}
            className="h-9"
          />
        </div>

        <div className="space-y-1">
          <Label htmlFor={`days-${stage.id}`} className="text-xs text-text-3">
            Target days in stage
          </Label>
          <Input
            id={`days-${stage.id}`}
            type="number"
            min={0}
            step={1}
            value={days}
            onChange={(e) => setDays(parseInt(e.target.value, 10) || 0)}
            className="h-9"
          />
        </div>

        <div className="flex items-end gap-1">
          <Button
            type="button"
            size="sm"
            variant={terminalWon ? "default" : "ghost"}
            onClick={() => {
              setTerminalWon(!terminalWon);
              if (!terminalWon) setTerminalLost(false);
            }}
            title="Mark as terminal Won stage"
          >
            <Award className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={terminalLost ? "default" : "ghost"}
            onClick={() => {
              setTerminalLost(!terminalLost);
              if (!terminalLost) setTerminalWon(false);
            }}
            title="Mark as terminal Lost stage"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onDelete}
            className="text-danger hover:text-danger"
            title="Delete stage"
          >
            <Trash className="h-3.5 w-3.5" />
          </Button>
        </div>

        {dirty ? (
          <div className="sm:col-span-4 flex justify-end">
            <Button type="button" size="sm" onClick={save}>
              Save changes
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
