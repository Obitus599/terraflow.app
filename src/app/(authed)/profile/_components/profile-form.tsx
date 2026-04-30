"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTransition } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyProfile } from "@/lib/settings/actions";
import {
  profileUpdateSchema,
  type ProfileUpdateInput,
} from "@/lib/settings/schema";

interface ProfileFormProps {
  initial: ProfileUpdateInput;
  email: string;
}

export function ProfileForm({ initial, email }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const form = useForm<ProfileUpdateInput>({
    resolver: zodResolver(profileUpdateSchema),
    defaultValues: initial,
  });

  function onSubmit(values: ProfileUpdateInput) {
    startTransition(async () => {
      const result = await updateMyProfile(values);
      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof ProfileUpdateInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
        return;
      }
      toast.success("Profile updated");
    });
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled className="bg-bg-3" />
        <p className="text-xs text-text-3">
          Email is set in Supabase Auth and can&apos;t be changed here. Ask Alex
          to update it from the dashboard.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input id="full_name" {...form.register("full_name")} />
        {form.formState.errors.full_name ? (
          <p className="text-xs text-danger">
            {form.formState.errors.full_name.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="avatar_url">Avatar URL</Label>
        <Input
          id="avatar_url"
          type="url"
          placeholder="https://…"
          {...form.register("avatar_url")}
        />
        <p className="text-xs text-text-3">
          Optional. Paste a URL to an image (e.g. your LinkedIn photo).
        </p>
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save profile"}
        </Button>
      </div>
    </form>
  );
}
