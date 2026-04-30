import { z } from "zod";

export const COLD_EMAIL_FLAGS = [
  "sent",
  "opened",
  "replied",
  "bounced",
  "booked_call",
] as const;

export type ColdEmailFlag = (typeof COLD_EMAIL_FLAGS)[number];

export const COLD_EMAIL_FLAG_LABELS: Record<ColdEmailFlag, string> = {
  sent: "Sent",
  opened: "Opened",
  replied: "Replied",
  bounced: "Bounced",
  booked_call: "Booked",
};

// New-prospect form: minimum needed to seed a row in the not-yet-sent state.
export const coldEmailSchema = z.object({
  prospect_name: z.string().min(1, "Name is required").max(120),
  company: z.string().optional(),
  email: z.email("Enter a valid email"),
  subject: z.string().optional(),
  notes: z.string().optional(),
});

export type ColdEmailInput = z.infer<typeof coldEmailSchema>;
