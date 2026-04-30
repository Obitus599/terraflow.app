"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAppSettings } from "@/lib/settings/actions";
import {
  appSettingsSchema,
  type AppSettingsInput,
} from "@/lib/settings/schema";

export function ThresholdsForm({ initial }: { initial: AppSettingsInput }) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<AppSettingsInput>({
    resolver: zodResolver(appSettingsSchema),
    defaultValues: initial,
  });

  function onSubmit(values: AppSettingsInput) {
    startTransition(async () => {
      const result = await updateAppSettings(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof AppSettingsInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
        return;
      }
      toast.success("Thresholds updated");
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          id="mrr_target_aed"
          label="MRR target (AED)"
          type="number"
          step={500}
          {...form.register("mrr_target_aed", { valueAsNumber: true })}
          error={form.formState.errors.mrr_target_aed?.message}
        />
        <Field
          id="mrr_target_month"
          label="Target month"
          type="date"
          {...form.register("mrr_target_month")}
          error={form.formState.errors.mrr_target_month?.message}
        />
        <Field
          id="min_cash_alarm_aed"
          label="Cash alarm floor (AED)"
          type="number"
          step={500}
          {...form.register("min_cash_alarm_aed", { valueAsNumber: true })}
          error={form.formState.errors.min_cash_alarm_aed?.message}
        />
        <Field
          id="max_bounce_rate"
          label="Max bounce rate (0–1)"
          type="number"
          step={0.01}
          {...form.register("max_bounce_rate", { valueAsNumber: true })}
          error={form.formState.errors.max_bounce_rate?.message}
        />
        <Field
          id="min_raj_completion_pct"
          label="Min Raj completion (0–1)"
          type="number"
          step={0.05}
          {...form.register("min_raj_completion_pct", { valueAsNumber: true })}
          error={form.formState.errors.min_raj_completion_pct?.message}
        />
        <Field
          id="owner_draw_pct"
          label="Owner draw % (0–1)"
          type="number"
          step={0.05}
          {...form.register("owner_draw_pct", { valueAsNumber: true })}
          error={form.formState.errors.owner_draw_pct?.message}
        />
        <Field
          id="ashish_split_pct"
          label="Ashish split % (0–1)"
          type="number"
          step={0.05}
          {...form.register("ashish_split_pct", { valueAsNumber: true })}
          error={form.formState.errors.ashish_split_pct?.message}
        />
        <Field
          id="morty_commission_pct"
          label="Morty commission % (0–1)"
          type="number"
          step={0.01}
          {...form.register("morty_commission_pct", { valueAsNumber: true })}
          error={form.formState.errors.morty_commission_pct?.message}
        />
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save thresholds"}
        </Button>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  error,
  ...rest
}: {
  id: string;
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} {...rest} />
      {error ? <p className="text-xs text-danger">{error}</p> : null}
    </div>
  );
}
