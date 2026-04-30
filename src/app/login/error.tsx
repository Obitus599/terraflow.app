"use client";

import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function LoginError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[login-error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6">
      <div className="w-full max-w-sm text-center">
        <p className="text-xs uppercase tracking-[0.18em] text-text-3">
          Sign-in error
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">
          Couldn&apos;t load the sign-in form
        </h1>
        <p className="mt-2 text-sm text-text-3">
          {error.message || "An unexpected error occurred."}
        </p>
        <Button onClick={reset} className="mt-6">
          Reload
        </Button>
      </div>
    </main>
  );
}
