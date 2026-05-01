"use client";

import { ArrowRight } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { StatusPill } from "@/components/status-pill";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cloneTemplate } from "@/lib/funnels/actions";
import { FUNNEL_CHANNEL_LABELS } from "@/lib/funnels/schema";

interface TemplateCardProps {
  template: {
    id: string;
    name: string;
    description: string | null;
    channel: string;
    template_slug: string | null;
    stages: { name: string; sort_order: number }[];
  };
}

export function TemplateCard({ template }: TemplateCardProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(template.name);
  const [isPending, startTransition] = useTransition();

  function onClone() {
    startTransition(async () => {
      const result = await cloneTemplate(template.id, name);
      if (!result.ok) {
        toast.error(result.message);
      }
    });
  }

  return (
    <div className="rounded-xl border border-line bg-bg-2 p-5">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-display text-base font-medium text-text">
          {template.name}
        </h3>
        <StatusPill tone="muted">
          {
            FUNNEL_CHANNEL_LABELS[
              template.channel as keyof typeof FUNNEL_CHANNEL_LABELS
            ]
          }
        </StatusPill>
      </div>

      {template.description ? (
        <p className="mt-2 text-xs text-text-3">{template.description}</p>
      ) : null}

      <div className="mt-4 flex flex-wrap items-center gap-1.5 text-[11px]">
        {template.stages
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((s, i, arr) => (
            <span key={s.name} className="flex items-center gap-1.5 text-text-3">
              <span className="rounded-full border border-line bg-bg-3 px-2 py-0.5 text-text-2">
                {s.name}
              </span>
              {i < arr.length - 1 ? (
                <ArrowRight className="h-3 w-3 text-text-4" />
              ) : null}
            </span>
          ))}
      </div>

      {open ? (
        <div className="mt-5 space-y-3 border-t border-line pt-4">
          <div className="space-y-2">
            <Label htmlFor={`name-${template.id}`}>Name your funnel</Label>
            <Input
              id={`name-${template.id}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q3 UAE clinics outreach"
              disabled={isPending}
            />
          </div>
          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={onClone}
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Creating…" : "Use template"}
            </Button>
          </div>
        </div>
      ) : (
        <Button
          type="button"
          variant="secondary"
          onClick={() => setOpen(true)}
          className="mt-5"
        >
          Use this template
        </Button>
      )}
    </div>
  );
}
