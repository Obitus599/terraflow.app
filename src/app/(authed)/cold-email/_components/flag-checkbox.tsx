"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import { Checkbox } from "@/components/ui/checkbox";
import { updateProspectFlag } from "@/lib/cold-email/actions";
import type { ColdEmailFlag } from "@/lib/cold-email/schema";
import { cn } from "@/lib/utils";

interface FlagCheckboxProps {
  prospectId: string;
  flag: ColdEmailFlag;
  initial: boolean;
  ariaLabel: string;
}

export function FlagCheckbox({
  prospectId,
  flag,
  initial,
  ariaLabel,
}: FlagCheckboxProps) {
  const [isPending, startTransition] = useTransition();

  function onChange(checked: boolean) {
    startTransition(async () => {
      const result = await updateProspectFlag(prospectId, flag, checked);
      if (!result.ok) toast.error(result.message);
    });
  }

  return (
    <Checkbox
      checked={initial}
      onCheckedChange={(v) => onChange(v === true)}
      disabled={isPending}
      aria-label={ariaLabel}
      className={cn(
        "data-[state=checked]:bg-accent data-[state=checked]:text-bg",
        isPending && "opacity-50",
      )}
    />
  );
}
