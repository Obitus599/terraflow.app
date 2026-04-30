import { Skeleton } from "@/components/ui/skeleton";

export default function PipelineLoading() {
  return (
    <>
      <div className="border-b border-line px-6 py-6 md:px-10 md:py-8">
        <Skeleton className="h-3 w-20 bg-bg-3" />
        <Skeleton className="mt-3 h-8 w-48 bg-bg-3" />
        <Skeleton className="mt-2 h-4 w-80 bg-bg-3" />
      </div>
      <div className="px-6 py-6 md:px-10 md:py-8">
        <div className="flex gap-3 overflow-hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="w-[280px] shrink-0 rounded-xl border border-line bg-bg-2"
            >
              <div className="border-b border-line px-4 py-3">
                <Skeleton className="h-4 w-24 bg-bg-3" />
              </div>
              <div className="space-y-2 p-3">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div
                    key={j}
                    className="rounded-lg border border-line bg-bg-3 p-3"
                  >
                    <Skeleton className="h-4 w-3/4 bg-bg-2" />
                    <Skeleton className="mt-2 h-3 w-1/2 bg-bg-2" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
