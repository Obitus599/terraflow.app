"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const ALLOWED_DOMAIN = "@terraflow.studio";

const schema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email")
    .refine(
      (val) => val.toLowerCase().endsWith(ALLOWED_DOMAIN),
      `Must be a ${ALLOWED_DOMAIN} address`,
    ),
});

type FormValues = z.infer<typeof schema>;

export function LoginForm() {
  const [sent, setSent] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: "" },
  });

  async function onSubmit({ email }: FormValues) {
    setServerError(null);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      setServerError(error.message);
      return;
    }
    setSent(email);
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-line bg-bg-2 p-6">
        <CheckCircle2 className="mb-3 h-5 w-5 text-success" />
        <p className="mb-1 font-display text-base text-text">Check your inbox</p>
        <p className="text-sm text-text-3">
          We sent a magic link to <span className="text-text">{sent}</span>. Click
          it to sign in. The link expires in 1 hour.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-text-2">
          Email
        </Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="you@terraflow.studio"
          disabled={form.formState.isSubmitting}
          {...form.register("email")}
        />
        {form.formState.errors.email ? (
          <p className="text-xs text-danger">
            {form.formState.errors.email.message}
          </p>
        ) : null}
      </div>

      {serverError ? (
        <p className="text-xs text-danger">{serverError}</p>
      ) : null}

      <Button
        type="submit"
        disabled={form.formState.isSubmitting}
        className="w-full"
      >
        {form.formState.isSubmitting ? "Sending…" : "Send magic link"}
        <ArrowRight className="ml-1 h-4 w-4" />
      </Button>
    </form>
  );
}
