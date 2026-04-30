"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { DealInput } from "@/lib/pipeline/schema";

import { DealForm } from "./deal-form";

interface DealSheetProps {
  mode: "create" | "edit" | "closed";
  dealId?: string;
  initial?: Partial<DealInput>;
  owners: { id: string; full_name: string }[];
  canDelete: boolean;
}

const MANAGED_PARAMS = ["edit", "new"];

export function DealSheet({
  mode,
  dealId,
  initial,
  owners,
  canDelete,
}: DealSheetProps) {
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
            {mode === "create" ? "New deal" : "Edit deal"}
          </SheetTitle>
          <SheetDescription className="text-text-3">
            {mode === "create"
              ? "Add a deal to the pipeline. Stage defaults to first touch."
              : "Drag the card on the board to move stages, or edit anything else here."}
          </SheetDescription>
        </SheetHeader>
        <div className="mt-6 px-1">
          {open ? (
            <DealForm
              mode={mode === "create" ? "create" : "edit"}
              dealId={dealId}
              owners={owners}
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
