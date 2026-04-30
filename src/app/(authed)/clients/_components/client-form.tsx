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
import { addClient, updateClient } from "@/lib/clients/actions";
import {
  CLIENT_HEALTHS,
  CLIENT_STATUSES,
  CLIENT_STATUS_LABELS,
  CLIENT_TYPES,
  CLIENT_TYPE_LABELS,
  clientSchema,
  type ClientInput,
} from "@/lib/clients/schema";

interface ClientFormProps {
  mode: "create" | "edit";
  clientId?: string;
  initial?: Partial<ClientInput>;
}

const HEALTH_LABEL: Record<(typeof CLIENT_HEALTHS)[number], string> = {
  green: "Green — healthy",
  yellow: "Yellow — at risk",
  red: "Red — critical",
};

export function ClientForm({ mode, clientId, initial }: ClientFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ClientInput>({
    resolver: zodResolver(clientSchema),
    defaultValues: {
      name: initial?.name ?? "",
      client_type: initial?.client_type ?? "recurring",
      monthly_aed: initial?.monthly_aed ?? 0,
      status: initial?.status ?? "active",
      health: initial?.health ?? "green",
      start_date: initial?.start_date ?? "",
      upsell_ideas: initial?.upsell_ideas ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const watchedType = useWatch({ control: form.control, name: "client_type" });
  const watchedStatus = useWatch({ control: form.control, name: "status" });
  const watchedHealth = useWatch({ control: form.control, name: "health" });

  function onSubmit(values: ClientInput) {
    startTransition(async () => {
      const action =
        mode === "create"
          ? addClient(values)
          : updateClient(clientId!, values);
      const result = await action;

      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof ClientInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
        return;
      }

      toast.success(mode === "create" ? "Client created" : "Client updated");
      if (mode === "edit" && clientId) {
        router.push(`/clients/${clientId}`);
        router.refresh();
      }
      // create flow redirects server-side; nothing to do.
    });
  }

  return (
    <form
      onSubmit={form.handleSubmit(onSubmit)}
      className="space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input id="name" autoComplete="off" {...form.register("name")} />
        {form.formState.errors.name ? (
          <p className="text-xs text-danger">
            {form.formState.errors.name.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client_type">Type</Label>
          <Select
            value={watchedType}
            onValueChange={(v) =>
              form.setValue("client_type", v as ClientInput["client_type"])
            }
          >
            <SelectTrigger id="client_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {CLIENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="monthly_aed">Monthly AED</Label>
          <Input
            id="monthly_aed"
            type="number"
            min={0}
            step={50}
            {...form.register("monthly_aed", { valueAsNumber: true })}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select
            value={watchedStatus}
            onValueChange={(v) =>
              form.setValue("status", v as ClientInput["status"])
            }
          >
            <SelectTrigger id="status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {CLIENT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="health">Health</Label>
          <Select
            value={watchedHealth}
            onValueChange={(v) =>
              form.setValue("health", v as ClientInput["health"])
            }
          >
            <SelectTrigger id="health">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CLIENT_HEALTHS.map((h) => (
                <SelectItem key={h} value={h}>
                  {HEALTH_LABEL[h]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="start_date">Start date</Label>
          <Input id="start_date" type="date" {...form.register("start_date")} />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="upsell_ideas">Upsell ideas</Label>
        <Textarea
          id="upsell_ideas"
          rows={2}
          placeholder="What's the next AED 1,000 we can add to this account?"
          {...form.register("upsell_ideas")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={4} {...form.register("notes")} />
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
          {isPending
            ? "Saving…"
            : mode === "create"
              ? "Create client"
              : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
