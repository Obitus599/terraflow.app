"use client";

import { zodResolver } from "@hookform/resolvers/zod";
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
import { createFunnel } from "@/lib/funnels/actions";
import {
  FUNNEL_CHANNELS,
  FUNNEL_CHANNEL_LABELS,
  funnelSchema,
  type FunnelInput,
} from "@/lib/funnels/schema";

export function BlankFunnelForm() {
  const [isPending, startTransition] = useTransition();
  const form = useForm<FunnelInput>({
    resolver: zodResolver(funnelSchema),
    defaultValues: {
      name: "",
      description: "",
      channel: "cold_email",
    },
  });
  const watchedChannel = useWatch({ control: form.control, name: "channel" });

  function onSubmit(values: FunnelInput) {
    startTransition(async () => {
      const result = await createFunnel(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof FunnelInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
      }
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-5 rounded-xl border border-line bg-bg-2 p-6"
    >
      <h3 className="font-display text-base font-medium text-text">
        Or build from scratch
      </h3>

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" placeholder="e.g. Spring 2026 Webinar" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-xs text-danger">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="channel">Channel</Label>
        <Select
          value={watchedChannel}
          onValueChange={(v) =>
            form.setValue("channel", v as FunnelInput["channel"])
          }
        >
          <SelectTrigger id="channel">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {FUNNEL_CHANNELS.map((c) => (
              <SelectItem key={c} value={c}>
                {FUNNEL_CHANNEL_LABELS[c]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          rows={3}
          placeholder="Optional"
          {...form.register("description")}
        />
      </div>

      <p className="text-xs text-text-3">
        We&apos;ll seed it with First touch · Won · Lost; you customize the
        stages on the next page.
      </p>

      <div className="flex justify-end">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Creating…" : "Create funnel"}
        </Button>
      </div>
    </form>
  );
}
