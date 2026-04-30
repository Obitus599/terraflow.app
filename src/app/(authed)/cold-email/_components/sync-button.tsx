"use client";

import { RefreshCw } from "lucide-react";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { syncApollo } from "@/lib/apollo/actions";

export function SyncButton() {
  const [isPending, startTransition] = useTransition();

  function onClick() {
    startTransition(async () => {
      const result = await syncApollo();
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(
        `Synced ${result.sequences} sequence(s) and ${result.mailboxes} mailbox(es)`,
      );
    });
  }

  return (
    <Button
      type="button"
      variant="secondary"
      onClick={onClick}
      disabled={isPending}
    >
      <RefreshCw
        className={`mr-1.5 h-3.5 w-3.5 ${isPending ? "animate-spin" : ""}`}
      />
      {isPending ? "Syncing…" : "Sync Apollo"}
    </Button>
  );
}
