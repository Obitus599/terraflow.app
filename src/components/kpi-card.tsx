import { cn } from "@/lib/utils";

interface KpiCardProps {
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent" | "success" | "warning" | "danger";
  className?: string;
}

const TONE_VALUE: Record<NonNullable<KpiCardProps["tone"]>, string> = {
  default: "text-text",
  accent: "text-accent",
  success: "text-success",
  warning: "text-warning",
  danger: "text-danger",
};

export function KpiCard({
  label,
  value,
  hint,
  tone = "default",
  className,
}: KpiCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-line bg-bg-2 p-5",
        className,
      )}
    >
      <p className="text-xs uppercase tracking-[0.18em] text-text-3">{label}</p>
      <p
        className={cn(
          "mt-2 font-display text-2xl font-medium tracking-tight md:text-3xl",
          TONE_VALUE[tone],
        )}
      >
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs text-text-3">{hint}</p>
      ) : null}
    </div>
  );
}
