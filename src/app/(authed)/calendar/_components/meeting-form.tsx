"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  addMeeting,
  deleteMeeting,
  updateMeeting,
} from "@/lib/meetings/actions";
import {
  meetingSchema,
  type MeetingInput,
} from "@/lib/meetings/schema";

interface MeetingFormProps {
  mode: "create" | "edit";
  meetingId?: string;
  initial?: Partial<MeetingInput>;
  clients: { id: string; name: string }[];
  deals: { id: string; prospect_name: string; company: string | null }[];
  canDelete: boolean;
  onSuccess?: () => void;
}

const NONE = "__none__";

export function MeetingForm({
  mode,
  meetingId,
  initial,
  clients,
  deals,
  canDelete,
  onSuccess,
}: MeetingFormProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isDeleting, startDeleting] = useTransition();

  const form = useForm<MeetingInput>({
    resolver: zodResolver(meetingSchema),
    defaultValues: {
      title: initial?.title ?? "",
      description: initial?.description ?? "",
      starts_at: initial?.starts_at ?? defaultStart(),
      ends_at: initial?.ends_at ?? defaultEnd(),
      location: initial?.location ?? "",
      attendees: initial?.attendees ?? "",
      pipeline_deal_id: initial?.pipeline_deal_id ?? "",
      client_id: initial?.client_id ?? "",
      notes: initial?.notes ?? "",
    },
  });

  const watchedDeal = useWatch({
    control: form.control,
    name: "pipeline_deal_id",
  });
  const watchedClient = useWatch({
    control: form.control,
    name: "client_id",
  });

  function onSubmit(values: MeetingInput) {
    startSaving(async () => {
      const result =
        mode === "create"
          ? await addMeeting(values)
          : await updateMeeting(meetingId!, values);

      if (!result.ok) {
        toast.error(result.message);
        if (result.fieldErrors) {
          for (const [field, messages] of Object.entries(result.fieldErrors)) {
            form.setError(field as keyof MeetingInput, {
              message: messages?.[0] ?? "Invalid",
            });
          }
        }
        return;
      }
      toast.success(mode === "create" ? "Meeting added" : "Meeting updated");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    });
  }

  function onDelete() {
    if (!meetingId) return;
    if (!confirm("Delete this meeting? This can't be undone.")) return;
    startDeleting(async () => {
      const result = await deleteMeeting(meetingId);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success("Meeting deleted");
      if (onSuccess) {
        onSuccess();
      } else {
        router.refresh();
      }
    });
  }

  const pending = isSaving || isDeleting;

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="title">Title</Label>
        <Input id="title" autoComplete="off" {...form.register("title")} />
        {form.formState.errors.title ? (
          <p className="text-xs text-danger">
            {form.formState.errors.title.message}
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="starts_at">Start</Label>
          <Input
            id="starts_at"
            type="datetime-local"
            {...form.register("starts_at")}
          />
          {form.formState.errors.starts_at ? (
            <p className="text-xs text-danger">
              {form.formState.errors.starts_at.message}
            </p>
          ) : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor="ends_at">End</Label>
          <Input
            id="ends_at"
            type="datetime-local"
            {...form.register("ends_at")}
          />
          {form.formState.errors.ends_at ? (
            <p className="text-xs text-danger">
              {form.formState.errors.ends_at.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location">Location / link</Label>
        <Input
          id="location"
          placeholder="e.g. Zoom, Google Meet, café address"
          {...form.register("location")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="attendees">Attendees</Label>
        <Input
          id="attendees"
          placeholder="comma-separated emails"
          {...form.register("attendees")}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="pipeline_deal_id">Linked deal</Label>
          <Select
            value={watchedDeal || NONE}
            onValueChange={(v) =>
              form.setValue("pipeline_deal_id", v === NONE ? "" : v)
            }
          >
            <SelectTrigger id="pipeline_deal_id">
              <SelectValue placeholder="(none)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>(none)</SelectItem>
              {deals.map((d) => (
                <SelectItem key={d.id} value={d.id}>
                  {d.prospect_name}
                  {d.company ? ` · ${d.company}` : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="client_id">Linked client</Label>
          <Select
            value={watchedClient || NONE}
            onValueChange={(v) =>
              form.setValue("client_id", v === NONE ? "" : v)
            }
          >
            <SelectTrigger id="client_id">
              <SelectValue placeholder="(none)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>(none)</SelectItem>
              {clients.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Agenda / description</Label>
        <Textarea
          id="description"
          rows={3}
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" rows={3} {...form.register("notes")} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {mode === "edit" && canDelete ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onDelete}
            disabled={pending}
            className="text-danger hover:text-danger"
          >
            {isDeleting ? "Deleting…" : "Delete"}
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={() => router.back()}
            disabled={pending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {isSaving
              ? "Saving…"
              : mode === "create"
                ? "Add meeting"
                : "Save changes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function defaultStart(): string {
  // Round up to the next half-hour, format as YYYY-MM-DDTHH:mm for
  // <input type="datetime-local">.
  const now = new Date();
  now.setMinutes(now.getMinutes() + (30 - (now.getMinutes() % 30)));
  now.setSeconds(0);
  now.setMilliseconds(0);
  return localISO(now);
}

function defaultEnd(): string {
  const start = new Date(defaultStart());
  start.setMinutes(start.getMinutes() + 30);
  return localISO(start);
}

function localISO(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
