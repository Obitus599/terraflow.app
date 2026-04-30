"use client";

import { AlertTriangle } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function AuthedError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[authed-error]", error);
  }, [error]);

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="w-full max-w-md rounded-xl border border-line bg-bg-2 p-8 text-center">
        <AlertTriangle className="mx-auto h-6 w-6 text-danger" />
        <p className="mt-4 text-xs uppercase tracking-[0.18em] text-text-3">
          Page error
        </p>
        <h1 className="mt-2 font-display text-2xl font-medium tracking-tight">
          Couldn&apos;t load this page
        </h1>
        <p className="mt-2 text-sm text-text-3">
          {error.message || "An unexpected error occurred."}
          {error.digest ? (
            <>
              <br />
              <span className="text-text-4">ID: {error.digest}</span>
            </>
          ) : null}
        </p>
        <div className="mt-6 flex justify-center gap-2">
          <Button onClick={reset}>Try again</Button>
          <Button variant="ghost" asChild>
            <Link href="/">Go home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
