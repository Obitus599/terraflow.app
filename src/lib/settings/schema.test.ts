import { describe, expect, it } from "vitest";

import {
  appSettingsSchema,
  profileUpdateSchema,
  teamMemberSchema,
} from "./schema";

describe("appSettingsSchema", () => {
  const valid = {
    mrr_target_aed: 15000,
    mrr_target_month: "2026-10-31",
    min_cash_alarm_aed: 10000,
    max_bounce_rate: 0.05,
    min_raj_completion_pct: 0.5,
    owner_draw_pct: 0.4,
    ashish_split_pct: 0.4,
    morty_commission_pct: 0.1,
  };

  it("accepts valid input", () => {
    expect(appSettingsSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects negative MRR target", () => {
    expect(
      appSettingsSchema.safeParse({ ...valid, mrr_target_aed: -1 }).success,
    ).toBe(false);
  });

  it("rejects bounce rate above 1", () => {
    expect(
      appSettingsSchema.safeParse({ ...valid, max_bounce_rate: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects empty target month", () => {
    expect(
      appSettingsSchema.safeParse({ ...valid, mrr_target_month: "" }).success,
    ).toBe(false);
  });
});

describe("teamMemberSchema", () => {
  const valid = {
    id: "00000000-0000-4000-8000-000000000001",
    full_name: "Raj",
    role: "team" as const,
    monthly_capacity_hours: 100,
    fixed_monthly_cost_aed: 1250,
  };

  it("accepts valid input", () => {
    expect(teamMemberSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects unknown role", () => {
    expect(
      teamMemberSchema.safeParse({ ...valid, role: "manager" }).success,
    ).toBe(false);
  });

  it("rejects negative capacity", () => {
    expect(
      teamMemberSchema.safeParse({ ...valid, monthly_capacity_hours: -1 })
        .success,
    ).toBe(false);
  });
});

describe("profileUpdateSchema", () => {
  it("accepts a valid full name with optional avatar", () => {
    expect(
      profileUpdateSchema.safeParse({
        full_name: "Alex Joseph",
        avatar_url: "https://example.com/me.jpg",
      }).success,
    ).toBe(true);
  });

  it("accepts an empty avatar_url (optional)", () => {
    expect(
      profileUpdateSchema.safeParse({ full_name: "Alex Joseph" }).success,
    ).toBe(true);
  });

  it("rejects empty full_name", () => {
    expect(
      profileUpdateSchema.safeParse({ full_name: "" }).success,
    ).toBe(false);
  });
});
