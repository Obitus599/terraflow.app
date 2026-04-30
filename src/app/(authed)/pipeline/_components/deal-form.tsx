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
import {
  addDeal,
  deleteDeal,
  updateDeal,
} from "@/lib/pipeline/actions";
import {
  CONFIDENCE_LABELS,
  PIPELINE_CONFIDENCES,
  PIPELINE_SOURCES,
  PIPELINE_STAGES,
  SOURCE_LABELS,
  STAGE_LABELS,
  dealSchema,
  type DealInput,
} from "@/lib/pipeline/schema";

interface DealFormProps {
  mode: "create" | "edit";
  dealId?: string;
  initial?: Partial<DealInput>;
  owners: { id: string; full_name: string }[];
  canDelete: boolean;
  /** Called after a successful save / delete. Sheet uses this to close while
   *  preserving the user's view (kanban vs filter state). */
  onSuccess?: () => void;
}

const NONE = "__none__";

export function DealForm({
  mode,
  dealId,
  initial,
  owners,
  canDelete,
  onSuccess,
}: DealFormProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const form = useForm<DealInput>({
    resolver: zodResolver(dealSchema),
    defaultValues: {
      prospect_name: initial?.prospect_name ?? "",
      company: initial?.company ?? "",
      source: initial?.source ?? "cold_email",
      stage: initial?.stage ?? "first_touch",
      confidence: initial?.confidence ?? "pipe",
      expected_aed_monthly: initial?.expected_aed_monthly ?? 0,
      expected_aed_one_time: initial?.expected_aed_one_time ?? 0,
      expected_close_month: initial?.expected_close_month ?? "",
      last_touch: initial?.last_touch ?? "",
      next_action: initial?.next_action ?? "",
      owner_id: initial?.owner_id ?? "",
      notes: initial?.notes ?? "",
      won_lost_reason: initial?.won_lost_reason ?? "",
    },
  });

  const watchedSource = useWatch({ control: form.control, name: "source" });
  const watchedStage = useWatch({ control: form.control, name: "stage" });
  const watchedConfidence = useWatch({
    control: form.control,
    name: "confidence",
  });
  const watchedOwner = useWatch({ control: form.control, name: "owner_id" });

  const isClosed = watchedStage === "won" || watchedStage === "lost";

  function onSubmit(values: DealInput) {
    startSaving(async () => {
      const result =
        mode === "create"
          ? await addDeal(values)
          : await updateDeal(dealId!, values);

      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof DealInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
        return;
      }

      toast.success(mode === "create" ? "Deal created" : "Deal updated");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!dealId) return;
    if (!confirm("Delete this deal? This can't be undone.")) return;
    startDeleting(async () => {
      const result = await deleteDeal(dealId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Deal deleted");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    });
  }

  const pending = isSaving || isDeleting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="prospect_name">Prospect</Label>
          <Input id="prospect_name" {...form.register("prospect_name")} />
          {form.formState.errors.prospect_name ? (
            <p className="text-xs text-danger">
              {form.formState.errors.prospect_name.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input id="company" {...form.register("company")} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="source">Source</Label>
          <Select
            value={watchedSource}
            onValueChange={(v) =>
              form.setValue("source", v as DealInput["source"])
            }
          >
            <SelectTrigger id="source">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_SOURCES.map((s) => (
                <SelectItem key={s} value={s}>
                  {SOURCE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="stage">Stage</Label>
          <Select
            value={watchedStage}
            onValueChange={(v) =>
              form.setValue("stage", v as DealInput["stage"])
            }
          >
            <SelectTrigger id="stage">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_STAGES.map((s) => (
                <SelectItem key={s} value={s}>
                  {STAGE_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confidence">Confidence</Label>
          <Select
            value={watchedConfidence}
            onValueChange={(v) =>
              form.setValue("confidence", v as DealInput["confidence"])
            }
          >
            <SelectTrigger id="confidence">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PIPELINE_CONFIDENCES.map((c) => (
                <SelectItem key={c} value={c}>
                  {CONFIDENCE_LABELS[c]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="expected_aed_monthly">Expected AED / month</Label>
          <Input
            id="expected_aed_monthly"
            type="number"
            min={0}
            step={100}
            {...form.register("expected_aed_monthly", { valueAsNumber: true })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="expected_aed_one_time">Expected one-time AED</Label>
          <Input
            id="expected_aed_one_time"
            type="number"
            min={0}
            step={100}
            {...form.register("expected_aed_one_time", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="expected_close_month">Close month</Label>
          <Input
            id="expected_close_month"
            type="date"
            {...form.register("expected_close_month")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_touch">Last touch</Label>
          <Input
            id="last_touch"
            type="date"
            {...form.register("last_touch")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="owner_id">Owner</Label>
          <Select
            value={watchedOwner || NONE}
            onValueChange={(v) =>
              form.setValue("owner_id", v === NONE ? "" : v)
            }
          >
            <SelectTrigger id="owner_id">
              <SelectValue placeholder="Unassigned" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Unassigned</SelectItem>
              {owners.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.full_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="next_action">Next action</Label>
        <Input
          id="next_action"
          placeholder="e.g. Send proposal Tuesday"
          {...form.register("next_action")}
        />
      </div>

      {isClosed ? (
        <div className="space-y-2">
          <Label htmlFor="won_lost_reason">
            {watchedStage === "won" ? "Won — why" : "Lost — why"}
          </Label>
          <Textarea
            id="won_lost_reason"
            rows={2}
            {...form.register("won_lost_reason")}
          />
        </div>
      ) : null}

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
                ? "Create deal"
                : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}
