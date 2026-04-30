import { format, formatDistanceToNowStrict, parseISO } from "date-fns";
import { AlertTriangle } from "lucide-react";

import { StatusPill } from "@/components/status-pill";
import { TableCell, TableRow } from "@/components/ui/table";

interface SequenceRowProps {
  sequence: {
    id: string;
    name: string;
    active: boolean;
    archived: boolean;
    num_steps: number;
    unique_delivered: number;
    unique_opened: number;
    unique_replied: number;
    unique_bounced: number;
    unique_clicked: number;
    open_rate: number;
    reply_rate: number;
    bounce_rate: number;
    click_rate: number;
    is_performing_poorly: boolean;
    last_used_at: string | null;
  };
}

function pct(n: number): string {
  return `${(n * 100).toFixed(1)}%`;
}

export function SequenceRow({ sequence: s }: SequenceRowProps) {
  const status = s.archived
    ? { label: "Archived", tone: "muted" as const }
    : s.active
      ? { label: "Active", tone: "success" as const }
      : { label: "Paused", tone: "warning" as const };

  const lastUsedRel = s.last_used_at
    ? formatDistanceToNowStrict(parseISO(s.last_used_at), { addSuffix: true })
    : "never";
  const lastUsedAbs = s.last_used_at
    ? format(parseISO(s.last_used_at), "d MMM yyyy")
    : "—";

  return (
    <TableRow className="border-line">
      <TableCell>
        <div className="flex items-center gap-2">
          <p className="text-sm text-text">{s.name}</p>
          {s.is_performing_poorly ? (
            <span title="Apollo flagged this sequence as underperforming">
              <AlertTriangle className="h-3.5 w-3.5 text-warning" />
            </span>
          ) : null}
        </div>
        <p className="mt-0.5 text-xs text-text-3">
          {s.num_steps} step{s.num_steps === 1 ? "" : "s"} · last used {lastUsedRel}
        </p>
      </TableCell>
      <TableCell>
        <StatusPill tone={status.tone}>{status.label}</StatusPill>
      </TableCell>
      <TableCell className="text-right text-sm text-text-2">
        {s.unique_delivered}
      </TableCell>
      <TableCell className="text-right text-sm text-text-2">
        {s.unique_opened}
        <span className="ml-1 text-xs text-text-3">({pct(s.open_rate)})</span>
      </TableCell>
      <TableCell className="hidden md:table-cell text-right text-sm text-text-2">
        {s.unique_replied}
        <span className="ml-1 text-xs text-text-3">({pct(s.reply_rate)})</span>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right text-sm text-text-2">
        {s.unique_clicked}
        <span className="ml-1 text-xs text-text-3">({pct(s.click_rate)})</span>
      </TableCell>
      <TableCell className="hidden lg:table-cell text-right">
        <span
          className={
            s.bounce_rate > 0.05
              ? "text-sm text-danger"
              : "text-sm text-text-2"
          }
        >
          {s.unique_bounced}
          <span className="ml-1 text-xs text-text-3">
            ({pct(s.bounce_rate)})
          </span>
        </span>
      </TableCell>
      <TableCell
        className="hidden xl:table-cell text-right text-xs text-text-3"
        title={lastUsedAbs}
      >
        {lastUsedAbs}
      </TableCell>
    </TableRow>
  );
}
