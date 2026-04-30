import { Skeleton } from "@/components/ui/skeleton";

export default function AuthedLoading() {
  return (
    <main className="flex-1 px-6 py-8 md:px-10 md:py-10">
      <Skeleton className="h-3 w-24 bg-bg-3" />
      <Skeleton className="mt-4 h-9 w-64 bg-bg-3" />
      <Skeleton className="mt-3 h-4 w-80 bg-bg-3" />

      <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-bg-2 p-5"
          >
            <Skeleton className="h-3 w-20 bg-bg-3" />
            <Skeleton className="mt-3 h-7 w-24 bg-bg-3" />
          </div>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-line bg-bg-2 p-5"
          >
            <Skeleton className="h-3 w-20 bg-bg-3" />
            <Skeleton className="mt-3 h-7 w-16 bg-bg-3" />
          </div>
        ))}
      </div>
    </main>
  );
}
