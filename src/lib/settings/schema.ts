import { z } from "zod";

export const appSettingsSchema = z.object({
  mrr_target_aed: z.number().int().nonnegative(),
  mrr_target_month: z.string().min(1, "Pick a target month"),
  min_cash_alarm_aed: z.number().int().nonnegative(),
  max_bounce_rate: z.number().min(0).max(1),
  min_raj_completion_pct: z.number().min(0).max(1),
  owner_draw_pct: z.number().min(0).max(1),
  ashish_split_pct: z.number().min(0).max(1),
  morty_commission_pct: z.number().min(0).max(1),
});

export type AppSettingsInput = z.infer<typeof appSettingsSchema>;

export const teamMemberSchema = z.object({
  id: z.string().min(1),
  full_name: z.string().min(1, "Name is required").max(120),
  role: z.enum(["admin", "team", "client"]),
  monthly_capacity_hours: z.number().int().nonnegative(),
  fixed_monthly_cost_aed: z.number().int().nonnegative(),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;

export const profileUpdateSchema = z.object({
  full_name: z.string().min(1, "Name is required").max(120),
  avatar_url: z.string().optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
