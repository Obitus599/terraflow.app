import { z } from "zod";

export const FUNNEL_CHANNELS = [
  "cold_email",
  "linkedin",
  "inbound",
  "referral",
  "content",
  "mixed",
] as const;

export const FUNNEL_CHANNEL_LABELS: Record<
  (typeof FUNNEL_CHANNELS)[number],
  string
> = {
  cold_email: "Cold email",
  linkedin: "LinkedIn",
  inbound: "Inbound",
  referral: "Referral",
  content: "Content / event",
  mixed: "Mixed",
};

export const FUNNEL_OUTCOMES = [
  "in_progress",
  "won",
  "lost",
  "dropped",
] as const;

export const FUNNEL_OUTCOME_LABELS: Record<
  (typeof FUNNEL_OUTCOMES)[number],
  string
> = {
  in_progress: "In progress",
  won: "Won",
  lost: "Lost",
  dropped: "Dropped",
};

export const funnelSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  description: z.string().optional(),
  channel: z.enum(FUNNEL_CHANNELS),
});
export type FunnelInput = z.infer<typeof funnelSchema>;

export const stageSchema = z.object({
  name: z.string().min(1, "Stage name is required").max(80),
  target_conversion_pct: z.number().min(0).max(1).default(0),
  target_days: z.number().int().nonnegative().default(0),
  is_terminal_won: z.boolean().default(false),
  is_terminal_lost: z.boolean().default(false),
});
export type StageInput = z.infer<typeof stageSchema>;

export const stageReorderSchema = z.object({
  funnel_id: z.string().min(1),
  stage_ids: z.array(z.string().min(1)),
});
