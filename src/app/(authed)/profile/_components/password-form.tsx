"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateMyPassword } from "@/lib/settings/actions";

export function PasswordForm() {
  const [pwd, setPwd] = useState("");
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (pwd !== confirm) {
      toast.error("Passwords don't match");
      return;
    }
    startTransition(async () => {
      const result = await updateMyPassword(pwd);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Password updated. You'll stay signed in here.");
      setPwd("");
      setConfirm("");
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="new_password">New password</Label>
        <Input
          id="new_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={pwd}
          onChange={(e) => setPwd(e.target.value)}
          required
        />
        <p className="text-xs text-text-3">
          At least 8 characters. Use a manager — we don&apos;t enforce
          complexity rules but Supabase rejects pwned passwords if leaked-
          password protection is enabled.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirm_password">Confirm new password</Label>
        <Input
          id="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          maxLength={72}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
      </div>

      <div className="flex justify-end border-t border-line pt-4">
        <Button
          type="submit"
          disabled={isPending || pwd.length < 8 || pwd !== confirm}
        >
          {isPending ? "Updating…" : "Update password"}
        </Button>
      </div>
    </form>
  );
}
