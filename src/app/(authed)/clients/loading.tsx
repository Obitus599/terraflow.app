import { Skeleton } from "@/components/ui/skeleton";

export default function ClientsLoading() {
  return (
    <>
      <div className="border-b border-line px-6 py-6 md:px-10 md:py-8">
        <Skeleton className="h-3 w-20 bg-bg-3" />
        <Skeleton className="mt-3 h-8 w-48 bg-bg-3" />
        <Skeleton className="mt-2 h-4 w-64 bg-bg-3" />
      </div>
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-bg-2 p-5"
            >
              <Skeleton className="h-5 w-3/4 bg-bg-3" />
              <Skeleton className="mt-2 h-3 w-1/3 bg-bg-3" />
              <Skeleton className="mt-6 h-8 w-1/2 bg-bg-3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
