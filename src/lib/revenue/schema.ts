import { z } from "zod";

export const REVENUE_TYPES = ["recurring", "project", "audit", "other"] as const;

export const REVENUE_TYPE_LABELS: Record<
  (typeof REVENUE_TYPES)[number],
  string
> = {
  recurring: "Recurring",
  project: "Project",
  audit: "Audit",
  other: "Other",
};

export const revenueSchema = z.object({
  received_date: z.string().min(1, "Date is required"),
  client_id: z.string().optional(),
  invoice_number: z.string().optional(),
  amount_aed: z
    .number({ message: "Enter an amount" })
    .int()
    .positive(),
  entry_type: z.enum(REVENUE_TYPES),
  notes: z.string().optional(),
});

export type RevenueInput = z.infer<typeof revenueSchema>;
