import { Skeleton } from "@/components/ui/skeleton";

export default function CashFlowLoading() {
  return (
    <>
      <div className="border-b border-line px-6 py-6 md:px-10 md:py-8">
        <Skeleton className="h-3 w-20 bg-bg-3" />
        <Skeleton className="mt-3 h-8 w-48 bg-bg-3" />
        <Skeleton className="mt-2 h-4 w-72 bg-bg-3" />
      </div>
      <div className="space-y-6 px-6 py-6 md:px-10 md:py-8">
        <div className="rounded-xl border border-line bg-bg-2 p-5">
          <Skeleton className="h-3 w-24 bg-bg-3" />
          <Skeleton className="mt-2 h-9 w-40 bg-bg-3" />
        </div>
        <div className="grid gap-3 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="rounded-xl border border-line bg-bg-2 p-5"
            >
              <Skeleton className="h-3 w-20 bg-bg-3" />
              <Skeleton className="mt-3 h-7 w-32 bg-bg-3" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
