"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { MeetingInput } from "@/lib/meetings/schema";

import { MeetingForm } from "./meeting-form";

interface MeetingSheetProps {
  mode: "create" | "edit" | "closed";
  meetingId?: string;
  initial?: Partial<MeetingInput>;
  clients: { id: string; name: string }[];
  deals: { id: string; prospect_name: string; company: string | null }[];
  canDelete: boolean;
}

const MANAGED_PARAMS = ["edit", "new"];

export function MeetingSheet({
  mode,
  meetingId,
  initial,
  clients,
  deals,
  canDelete,
}: MeetingSheetProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const open = mode !== "closed";

  function close() {
    const next = new URLSearchParams(params.toString());
    for (const k of MANAGED_PARAMS) next.delete(k);
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname);
    router.refresh();
  }

  return (
    <Sheet open={open} onOpenChange={(v) => !v && close()}>
      <SheetContent
        side="right"
        className="w-full overflow-y-auto border-line bg-bg-2 sm:max-w-2xl"
      >
        <SheetHeader>
          <SheetTitle className="font-display text-xl text-text">
            {mode === "create" ? "New meeting" : "Edit meeting"}
          </SheetTitle>
          <SheetDescription className="text-text-3">
            Times use your local timezone. Link a deal or client to surface
            the meeting in those views.
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-1">
          {open ? (
            <MeetingForm
              mode={mode === "create" ? "create" : "edit"}
              meetingId={meetingId}
              clients={clients}
              deals={deals}
              initial={initial}
              canDelete={canDelete}
              onSuccess={close}
            />
          ) : null}
        </div>
      </SheetContent>
    </Sheet>
  );
}
