import { z } from "zod";

export const CLIENT_TYPES = ["recurring", "project", "recurring_pending"] as const;
export const CLIENT_STATUSES = ["active", "paused", "churned", "pending"] as const;
export const CLIENT_HEALTHS = ["green", "yellow", "red"] as const;

export const CLIENT_TYPE_LABELS: Record<(typeof CLIENT_TYPES)[number], string> = {
  recurring: "Recurring",
  project: "Project",
  recurring_pending: "Recurring (pending)",
};

export const CLIENT_STATUS_LABELS: Record<(typeof CLIENT_STATUSES)[number], string> = {
  active: "Active",
  paused: "Paused",
  churned: "Churned",
  pending: "Pending",
};

// No transforms — keep z.input ≡ z.output so RHF's typing stays sane.
// Empty-string-to-null normalization happens in the server action.
export const clientSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  client_type: z.enum(CLIENT_TYPES),
  monthly_aed: z
    .number({ message: "Enter a number" })
    .int()
    .nonnegative(),
  status: z.enum(CLIENT_STATUSES),
  health: z.enum(CLIENT_HEALTHS),
  start_date: z.string().optional(),
  upsell_ideas: z.string().optional(),
  notes: z.string().optional(),
});

export type ClientInput = z.infer<typeof clientSchema>;
