"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { addProspect } from "@/lib/cold-email/actions";
import { coldEmailSchema, type ColdEmailInput } from "@/lib/cold-email/schema";

export function ColdEmailForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const form = useForm<ColdEmailInput>({
    resolver: zodResolver(coldEmailSchema),
    defaultValues: {
      prospect_name: "",
      company: "",
      email: "",
      subject: "",
      notes: "",
    },
  });

  function onSubmit(values: ColdEmailInput) {
    startTransition(async () => {
      const result = await addProspect(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof ColdEmailInput, {
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

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" {...form.register("email")} />
        {form.formState.errors.email ? (
          <p className="text-xs text-danger">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="subject">Subject</Label>
        <Input
          id="subject"
          placeholder="e.g. Quick thought on Reva Medical Group"
          {...form.register("subject")}
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
          {isPending ? "Adding…" : "Add prospect"}
        </Button>
      </div>
    </form>
  );
}
