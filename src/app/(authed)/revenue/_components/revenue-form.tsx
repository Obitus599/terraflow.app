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
import { addRevenue } from "@/lib/revenue/actions";
import {
  REVENUE_TYPES,
  REVENUE_TYPE_LABELS,
  revenueSchema,
  type RevenueInput,
} from "@/lib/revenue/schema";

const NONE = "__none__";

interface RevenueFormProps {
  clients: { id: string; name: string }[];
}

export function RevenueForm({ clients }: RevenueFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<RevenueInput>({
    resolver: zodResolver(revenueSchema),
    defaultValues: {
      received_date: format(new Date(), "yyyy-MM-dd"),
      client_id: "",
      invoice_number: "",
      amount_aed: 0,
      entry_type: "recurring",
      notes: "",
    },
  });

  const watchedType = useWatch({ control: form.control, name: "entry_type" });
  const watchedClient = useWatch({ control: form.control, name: "client_id" });

  function onSubmit(values: RevenueInput) {
    startTransition(async () => {
      const result = await addRevenue(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof RevenueInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
      }
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="received_date">Received date</Label>
          <Input
            id="received_date"
            type="date"
            {...form.register("received_date")}
          />
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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="client_id">Client</Label>
          <Select
            value={watchedClient || NONE}
            onValueChange={(v) =>
              form.setValue("client_id", v === NONE ? "" : v)
            }
          >
            <SelectTrigger id="client_id">
              <SelectValue placeholder="(unattributed)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>(unattributed)</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="entry_type">Type</Label>
          <Select
            value={watchedType}
            onValueChange={(v) =>
              form.setValue("entry_type", v as RevenueInput["entry_type"])
            }
          >
            <SelectTrigger id="entry_type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REVENUE_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {REVENUE_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="invoice_number">Invoice #</Label>
        <Input id="invoice_number" {...form.register("invoice_number")} />
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
          {isPending ? "Logging…" : "Log payment"}
        </Button>
      </div>
    </form>
  );
}
