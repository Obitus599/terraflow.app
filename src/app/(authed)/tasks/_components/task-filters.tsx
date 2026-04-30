"use client";

import { Search, X } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TASK_PRIORITIES,
  TASK_PRIORITY_LABELS,
  TASK_STATUSES,
  TASK_STATUS_LABELS,
} from "@/lib/tasks/schema";

interface TaskFiltersProps {
  owners: { id: string; full_name: string }[];
  clients: { id: string; name: string }[];
}

const ANY = "__any__";

export function TaskFilters({ owners, clients }: TaskFiltersProps) {
  const router = useRouter();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function setParam(key: string, value: string | null) {
    const next = new URLSearchParams(params.toString());
    if (!value || value === ANY) next.delete(key);
    else next.set(key, value);
    next.delete("highlight");
    startTransition(() => router.replace(`/tasks?${next.toString()}`));
  }

  const hasFilters =
    !!params.get("q") ||
    !!params.get("status") ||
    !!params.get("priority") ||
    !!params.get("owner") ||
    !!params.get("client") ||
    !!params.get("due");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form
        action={(formData) => {
          const q = String(formData.get("q") ?? "");
          setParam("q", q);
        }}
        className="relative flex-1 min-w-[12rem] max-w-md"
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-3" />
        <Input
          name="q"
          defaultValue={params.get("q") ?? ""}
          placeholder="Search tasks…"
          className="pl-9"
        />
      </form>

      <Select
        value={params.get("status") ?? ANY}
        onValueChange={(v) => setParam("status", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any status</SelectItem>
          {TASK_STATUSES.map((s) => (
            <SelectItem key={s} value={s}>
              {TASK_STATUS_LABELS[s]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("priority") ?? ANY}
        onValueChange={(v) => setParam("priority", v)}
      >
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Priority" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any priority</SelectItem>
          {TASK_PRIORITIES.map((p) => (
            <SelectItem key={p} value={p}>
              {TASK_PRIORITY_LABELS[p]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("owner") ?? ANY}
        onValueChange={(v) => setParam("owner", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Owner" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any owner</SelectItem>
          {owners.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.full_name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("client") ?? ANY}
        onValueChange={(v) => setParam("client", v)}
      >
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Client" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any client</SelectItem>
          {clients.map((c) => (
            <SelectItem key={c.id} value={c.id}>
              {c.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select
        value={params.get("due") ?? ANY}
        onValueChange={(v) => setParam("due", v)}
      >
        <SelectTrigger className="w-[140px]">
          <SelectValue placeholder="Due" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ANY}>Any due date</SelectItem>
          <SelectItem value="overdue">Overdue</SelectItem>
          <SelectItem value="this_week">Due this week</SelectItem>
          <SelectItem value="no_due">No due date</SelectItem>
        </SelectContent>
      </Select>

      {hasFilters ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            startTransition(() => router.replace("/tasks"));
          }}
          disabled={isPending}
        >
          <X className="mr-1 h-3 w-3" />
          Clear
        </Button>
      ) : null}
    </div>
  );
}
