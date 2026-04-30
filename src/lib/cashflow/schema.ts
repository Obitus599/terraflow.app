import { z } from "zod";

export const CASH_DIRECTIONS = ["in", "out"] as const;
export const CASH_CATEGORIES = [
  "revenue",
  "salary",
  "tools",
  "tax",
  "refund",
  "equipment",
  "other",
] as const;

export const CASH_DIRECTION_LABELS: Record<
  (typeof CASH_DIRECTIONS)[number],
  string
> = {
  in: "In",
  out: "Out",
};

export const CASH_CATEGORY_LABELS: Record<
  (typeof CASH_CATEGORIES)[number],
  string
> = {
  revenue: "Revenue",
  salary: "Salary",
  tools: "Tools",
  tax: "Tax",
  refund: "Refund",
  equipment: "Equipment",
  other: "Other",
};

export const cashFlowSchema = z.object({
  entry_date: z.string().min(1, "Date is required"),
  direction: z.enum(CASH_DIRECTIONS),
  category: z.enum(CASH_CATEGORIES),
  description: z.string().optional(),
  amount_aed: z
    .number({ message: "Enter an amount" })
    .int()
    .positive(),
  notes: z.string().optional(),
});

export type CashFlowInput = z.infer<typeof cashFlowSchema>;

export const bankBalanceSchema = z.object({
  current_aed: z
    .number({ message: "Enter an amount" })
    .int()
    .nonnegative(),
});

export type BankBalanceInput = z.infer<typeof bankBalanceSchema>;
