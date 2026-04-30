import { z } from "zod";

export const PIPELINE_STAGES = [
  "first_touch",
  "replied",
  "call_booked",
  "proposal_sent",
  "mou_signed",
  "kickoff",
  "won",
  "lost",
] as const;

// Stages shown on the Kanban; won/lost are accessed via /pipeline?view=closed
export const ACTIVE_STAGES = [
  "first_touch",
  "replied",
  "call_booked",
  "proposal_sent",
  "mou_signed",
  "kickoff",
] as const;

export const PIPELINE_SOURCES = [
  "cold_email",
  "linkedin",
  "referral",
  "morty",
  "inbound",
  "other",
] as const;

export const PIPELINE_CONFIDENCES = ["commit", "best_case", "pipe"] as const;

export const STAGE_LABELS: Record<(typeof PIPELINE_STAGES)[number], string> = {
  first_touch: "First touch",
  replied: "Replied",
  call_booked: "Call booked",
  proposal_sent: "Proposal sent",
  mou_signed: "MOU signed",
  kickoff: "Kickoff",
  won: "Won",
  lost: "Lost",
};

export const SOURCE_LABELS: Record<(typeof PIPELINE_SOURCES)[number], string> = {
  cold_email: "Cold email",
  linkedin: "LinkedIn",
  referral: "Referral",
  morty: "Morty",
  inbound: "Inbound",
  other: "Other",
};

export const CONFIDENCE_LABELS: Record<
  (typeof PIPELINE_CONFIDENCES)[number],
  string
> = {
  commit: "Commit",
  best_case: "Best case",
  pipe: "Pipe",
};

export const CONFIDENCE_TONE: Record<
  (typeof PIPELINE_CONFIDENCES)[number],
  "success" | "accent" | "muted"
> = {
  commit: "success",
  best_case: "accent",
  pipe: "muted",
};

export const dealSchema = z.object({
  prospect_name: z.string().min(1, "Prospect name is required").max(200),
  company: z.string().optional(),
  source: z.enum(PIPELINE_SOURCES),
  stage: z.enum(PIPELINE_STAGES),
  confidence: z.enum(PIPELINE_CONFIDENCES),
  expected_aed_monthly: z.number().nonnegative(),
  expected_aed_one_time: z.number().nonnegative(),
  expected_close_month: z.string().optional(),
  last_touch: z.string().optional(),
  next_action: z.string().optional(),
  owner_id: z.string().optional(),
  notes: z.string().optional(),
  won_lost_reason: z.string().optional(),
});

export type DealInput = z.infer<typeof dealSchema>;
