"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateBankBalance } from "@/lib/cashflow/actions";
import { formatAed } from "@/lib/format";
import { cn } from "@/lib/utils";

interface BalanceEditorProps {
  current: number;
  threshold: number;
  canEdit: boolean;
}

export function BalanceEditor({ current, threshold, canEdit }: BalanceEditorProps) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [isPending, startTransition] = useTransition();

  const isLow = current < threshold;

  function save() {
    startTransition(async () => {
      const result = await updateBankBalance({ current_aed: value });
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Bank balance updated");
      setEditing(false);
    });
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-xl border p-5 sm:flex-row sm:items-center sm:justify-between",
        isLow ? "border-danger/30 bg-danger/5" : "border-line bg-bg-2",
      )}
    >
      <div>
        <p className="text-xs uppercase tracking-[0.18em] text-text-3">
          Bank balance
        </p>
        {editing ? (
          <Input
            type="number"
            value={value}
            onChange={(e) => setValue(Number(e.target.value))}
            min={0}
            step={1}
            className="mt-2 max-w-[200px]"
            autoFocus
          />
        ) : (
          <p
            className={cn(
              "mt-1 font-display text-3xl font-medium tracking-tight",
              isLow ? "text-danger" : "text-accent",
            )}
          >
            {formatAed(current)}
          </p>
        )}
        <p className="mt-1 text-xs text-text-3">
          Floor: {formatAed(threshold)}
          {isLow ? " · below alarm" : ""}
        </p>
      </div>
      {canEdit ? (
        editing ? (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEditing(false);
                setValue(current);
              }}
              disabled={isPending}
            >
              <X className="mr-1 h-3.5 w-3.5" />
              Cancel
            </Button>
            <Button size="sm" onClick={save} disabled={isPending}>
              <Check className="mr-1 h-3.5 w-3.5" />
              {isPending ? "Saving…" : "Save"}
            </Button>
          </div>
        ) : (
          <Button
            variant="secondary"
            size="sm"
            onClick={() => {
              setValue(current);
              setEditing(true);
            }}
          >
            <Pencil className="mr-1 h-3.5 w-3.5" />
            Update balance
          </Button>
        )
      ) : null}
    </div>
  );
}
