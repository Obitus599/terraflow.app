import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 text-center">
      <p className="text-xs uppercase tracking-[0.18em] text-text-3">404</p>
      <h1 className="mt-3 font-display text-3xl font-medium tracking-tight md:text-4xl">
        Not found
      </h1>
      <p className="mt-2 max-w-md text-sm text-text-3">
        The page you&apos;re looking for doesn&apos;t exist, or you don&apos;t
        have permission to view it.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Take me home</Link>
      </Button>
    </main>
  );
}
