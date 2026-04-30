import Link from "next/link";

import { StatusPill } from "@/components/status-pill";
import {
  CLIENT_STATUS_LABELS,
  CLIENT_TYPE_LABELS,
} from "@/lib/clients/schema";
import { formatAedCompact } from "@/lib/format";
import { cn } from "@/lib/utils";

interface ClientCardProps {
  client: {
    id: string;
    name: string;
    client_type: string;
    monthly_aed: number;
    status: string;
    health: string;
    notes: string | null;
  };
}

const HEALTH_DOT: Record<string, string> = {
  green: "bg-success",
  yellow: "bg-warning",
  red: "bg-danger",
};

const STATUS_TONE: Record<string, "success" | "warning" | "danger" | "muted"> = {
  active: "success",
  paused: "warning",
  churned: "danger",
  pending: "muted",
};

export function ClientCard({ client }: ClientCardProps) {
  const typeLabel =
    CLIENT_TYPE_LABELS[client.client_type as keyof typeof CLIENT_TYPE_LABELS] ??
    client.client_type;
  const statusLabel =
    CLIENT_STATUS_LABELS[client.status as keyof typeof CLIENT_STATUS_LABELS] ??
    client.status;
  const tone = STATUS_TONE[client.status] ?? "muted";

  return (
    <Link
      href={`/clients/${client.id}`}
      className="group flex flex-col rounded-xl border border-line bg-bg-2 p-5 transition-colors hover:border-text-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "h-2 w-2 shrink-0 rounded-full",
              HEALTH_DOT[client.health] ?? "bg-text-4",
            )}
            aria-label={`health ${client.health}`}
          />
          <h3 className="truncate font-display text-base font-medium text-text group-hover:text-accent">
            {client.name}
          </h3>
        </div>
        <StatusPill tone={tone}>{statusLabel}</StatusPill>
      </div>

      <p className="mt-1 text-xs text-text-3">{typeLabel}</p>

      <div className="mt-6 flex items-baseline gap-2">
        <span className="font-display text-2xl font-medium text-text">
          {formatAedCompact(client.monthly_aed)}
        </span>
        <span className="text-xs text-text-3">/ month</span>
      </div>

      {client.notes ? (
        <p className="mt-4 line-clamp-2 text-xs text-text-3">{client.notes}</p>
      ) : null}
    </Link>
  );
}
