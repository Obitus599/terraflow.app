import { format, parseISO } from "date-fns";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { initialsOf } from "@/lib/format";

const ACTION_TONE: Record<string, string> = {
  insert: "text-success",
  update: "text-warning",
  delete: "text-danger",
};

interface AuditEntry {
  id: string;
  table_name: string;
  record_id: string | null;
  action: string;
  created_at: string;
  actor_id: string | null;
}

interface AuditLogTableProps {
  entries: AuditEntry[];
  actorsById: Record<string, string>;
}

export function AuditLogTable({ entries, actorsById }: AuditLogTableProps) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-line bg-bg-2 px-6 py-8 text-center text-sm text-text-3">
        No changes logged yet. As soon as someone creates, edits, or deletes
        anything, the audit log fills in.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-line bg-bg-2">
      <Table>
        <TableHeader>
          <TableRow className="border-line hover:bg-transparent">
            <TableHead>When</TableHead>
            <TableHead>Who</TableHead>
            <TableHead>Action</TableHead>
            <TableHead>Table</TableHead>
            <TableHead className="hidden md:table-cell">Record</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => {
            const actor = entry.actor_id ? actorsById[entry.actor_id] : null;
            return (
              <TableRow key={entry.id} className="border-line">
                <TableCell className="text-sm text-text-3">
                  {format(parseISO(entry.created_at), "d MMM · HH:mm")}
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="grid h-6 w-6 place-items-center rounded-full bg-bg-3 text-[10px] text-text-2">
                      {initialsOf(actor)}
                    </span>
                    <span className="text-sm text-text-2">{actor ?? "system"}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <span
                    className={`text-xs font-medium uppercase tracking-[0.18em] ${
                      ACTION_TONE[entry.action] ?? "text-text-3"
                    }`}
                  >
                    {entry.action}
                  </span>
                </TableCell>
                <TableCell className="text-sm text-text-2">
                  {entry.table_name}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  <code className="text-xs text-text-3">
                    {entry.record_id?.slice(0, 8) ?? "—"}
                  </code>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
