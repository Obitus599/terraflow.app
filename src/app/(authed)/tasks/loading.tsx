import { Skeleton } from "@/components/ui/skeleton";

export default function TasksLoading() {
  return (
    <>
      <div className="border-b border-line px-6 py-6 md:px-10 md:py-8">
        <Skeleton className="h-3 w-20 bg-bg-3" />
        <Skeleton className="mt-3 h-8 w-48 bg-bg-3" />
        <Skeleton className="mt-2 h-4 w-72 bg-bg-3" />
      </div>
      <div className="flex flex-col gap-6 px-6 py-6 md:px-10 md:py-8">
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-32 bg-bg-3" />
          ))}
        </div>
        <div className="rounded-xl border border-line bg-bg-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="flex items-center justify-between border-b border-line px-4 py-3 last:border-b-0"
            >
              <Skeleton className="h-4 w-1/3 bg-bg-3" />
              <Skeleton className="h-6 w-24 bg-bg-3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
