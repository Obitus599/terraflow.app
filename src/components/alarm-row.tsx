import { CheckCircle2, AlertTriangle } from "lucide-react";

import { cn } from "@/lib/utils";

interface AlarmRowProps {
  label: string;
  value: string;
  triggered: boolean;
  description?: string;
}

export function AlarmRow({ label, value, triggered, description }: AlarmRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 rounded-xl border px-5 py-4",
        triggered
          ? "border-danger/30 bg-danger/5"
          : "border-line bg-bg-2",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        {triggered ? (
          <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
        ) : (
          <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
        )}
        <div className="min-w-0">
          <p className="truncate text-sm text-text">{label}</p>
          {description ? (
            <p className="truncate text-xs text-text-3">{description}</p>
          ) : null}
        </div>
      </div>
      <p
        className={cn(
          "shrink-0 font-display text-sm",
          triggered ? "text-danger" : "text-text-2",
        )}
      >
        {value}
      </p>
    </div>
  );
}
