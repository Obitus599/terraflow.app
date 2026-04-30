import { cn } from "@/lib/utils";

type Tone = "success" | "warning" | "danger" | "muted" | "accent";

const TONE: Record<Tone, string> = {
  success: "bg-success/10 text-success border-success/20",
  warning: "bg-warning/10 text-warning border-warning/20",
  danger: "bg-danger/10 text-danger border-danger/20",
  muted: "bg-text-3/10 text-text-3 border-text-3/20",
  accent: "bg-accent/10 text-accent border-accent/30",
};

interface StatusPillProps {
  tone: Tone;
  children: React.ReactNode;
  className?: string;
}

export function StatusPill({ tone, children, className }: StatusPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        TONE[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}
