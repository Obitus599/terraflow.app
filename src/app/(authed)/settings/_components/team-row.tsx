"use client";

import { Check, Pencil, X } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TableCell, TableRow } from "@/components/ui/table";
import { initialsOf } from "@/lib/format";
import { updateTeamMember } from "@/lib/settings/actions";
import type { TeamMemberInput } from "@/lib/settings/schema";

interface TeamRowProps {
  member: {
    id: string;
    email: string;
    full_name: string;
    role: string;
    monthly_capacity_hours: number;
    fixed_monthly_cost_aed: number;
  };
}

export function TeamRow({ member }: TeamRowProps) {
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [draft, setDraft] = useState<TeamMemberInput>({
    id: member.id,
    full_name: member.full_name,
    role: member.role as "admin" | "team" | "client",
    monthly_capacity_hours: member.monthly_capacity_hours,
    fixed_monthly_cost_aed: member.fixed_monthly_cost_aed,
  });

  function onSave() {
    startTransition(async () => {
      const result = await updateTeamMember(draft);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(`${draft.full_name} updated`);
      setEditing(false);
    });
  }

  function onCancel() {
    setDraft({
      id: member.id,
      full_name: member.full_name,
      role: member.role as "admin" | "team" | "client",
      monthly_capacity_hours: member.monthly_capacity_hours,
      fixed_monthly_cost_aed: member.fixed_monthly_cost_aed,
    });
    setEditing(false);
  }

  return (
    <TableRow className="border-line">
      <TableCell>
        <div className="flex items-center gap-3">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-bg-3 text-xs text-text-2">
            {initialsOf(member.full_name)}
          </span>
          <div className="min-w-0">
            {editing ? (
              <Input
                value={draft.full_name}
                onChange={(e) =>
                  setDraft({ ...draft, full_name: e.target.value })
                }
                className="h-8 w-40"
              />
            ) : (
              <p className="text-sm text-text">{member.full_name}</p>
            )}
            <p className="truncate text-xs text-text-3">{member.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        {editing ? (
          <Select
            value={draft.role}
            onValueChange={(v) =>
              setDraft({ ...draft, role: v as "admin" | "team" | "client" })
            }
          >
            <SelectTrigger className="h-8 w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="team">Team</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
        ) : (
          <span className="text-xs uppercase tracking-[0.18em] text-text-3">
            {member.role}
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {editing ? (
          <Input
            type="number"
            min={0}
            step={5}
            value={draft.monthly_capacity_hours}
            onChange={(e) =>
              setDraft({
                ...draft,
                monthly_capacity_hours: Number(e.target.value),
              })
            }
            className="h-8 w-20 text-right"
          />
        ) : (
          <span className="text-sm text-text-2">
            {member.monthly_capacity_hours}h
          </span>
        )}
      </TableCell>
      <TableCell className="text-right">
        {editing ? (
          <Input
            type="number"
            min={0}
            step={50}
            value={draft.fixed_monthly_cost_aed}
            onChange={(e) =>
              setDraft({
                ...draft,
                fixed_monthly_cost_aed: Number(e.target.value),
              })
            }
            className="h-8 w-24 text-right"
          />
        ) : (
          <span className="text-sm text-text-2">
            AED {member.fixed_monthly_cost_aed.toLocaleString("en-AE")}
          </span>
        )}
      </TableCell>
      <TableCell className="w-32 text-right">
        {editing ? (
          <div className="flex items-center justify-end gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={onCancel}
              disabled={isPending}
            >
              <X className="h-3.5 w-3.5" />
            </Button>
            <Button size="sm" onClick={onSave} disabled={isPending}>
              <Check className="h-3.5 w-3.5" />
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setEditing(true)}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
        )}
      </TableCell>
    </TableRow>
  );
}
