"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
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
import { addCashEntry } from "@/lib/cashflow/actions";
import {
  CASH_CATEGORIES,
  CASH_CATEGORY_LABELS,
  CASH_DIRECTIONS,
  CASH_DIRECTION_LABELS,
  cashFlowSchema,
  type CashFlowInput,
} from "@/lib/cashflow/schema";

export function CashFlowForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<CashFlowInput>({
    resolver: zodResolver(cashFlowSchema),
    defaultValues: {
      entry_date: format(new Date(), "yyyy-MM-dd"),
      direction: "out",
      category: "tools",
      description: "",
      amount_aed: 0,
      notes: "",
    },
  });

  const watchedDirection = useWatch({
    control: form.control,
    name: "direction",
  });
  const watchedCategory = useWatch({
    control: form.control,
    name: "category",
  });

  function onSubmit(values: CashFlowInput) {
    startTransition(async () => {
      const result = await addCashEntry(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof CashFlowInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="entry_date">Date</Label>
          <Input
            id="entry_date"
            type="date"
            {...form.register("entry_date")}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="direction">Direction</Label>
          <Select
            value={watchedDirection}
            onValueChange={(v) =>
              form.setValue("direction", v as CashFlowInput["direction"])
            }
          >
            <SelectTrigger id="direction">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CASH_DIRECTIONS.map((d) => (
                <SelectItem key={d} value={d}>
                  {CASH_DIRECTION_LABELS[d]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="amount_aed">Amount AED</Label>
          <Input
            id="amount_aed"
            type="number"
            min={1}
            step={1}
            {...form.register("amount_aed", { valueAsNumber: true })}
          />
          {form.formState.errors.amount_aed ? (
            <p className="text-xs text-danger">
              {form.formState.errors.amount_aed.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Category</Label>
        <Select
          value={watchedCategory}
          onValueChange={(v) =>
            form.setValue("category", v as CashFlowInput["category"])
          }
        >
          <SelectTrigger id="category">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CASH_CATEGORIES.map((c) => (
              <SelectItem key={c} value={c}>
                {CASH_CATEGORY_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Input
          id="description"
          placeholder="e.g. Vercel Pro · April"
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>

      <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Logging…" : "Log entry"}
        </Button>
      </div>
    </form>
  );
}
