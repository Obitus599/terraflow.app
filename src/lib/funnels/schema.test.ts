import { describe, expect, it } from "vitest";

import { funnelSchema, stageSchema } from "./schema";

describe("funnelSchema", () => {
  const valid = {
    name: "UAE Aesthetics Outreach",
    description: "Cold email funnel for the founding-clinic offer",
    channel: "cold_email" as const,
  };

  it("accepts valid input", () => {
    expect(funnelSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty name", () => {
    expect(funnelSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("rejects unknown channel", () => {
    expect(
      funnelSchema.safeParse({ ...valid, channel: "carrier_pigeon" }).success,
    ).toBe(false);
  });

  it("treats description as optional", () => {
    expect(
      funnelSchema.safeParse({ name: "x", channel: "inbound" }).success,
    ).toBe(true);
  });
});

describe("stageSchema", () => {
  const valid = {
    name: "First touch",
    target_conversion_pct: 0.1,
    target_days: 3,
    is_terminal_won: false,
    is_terminal_lost: false,
  };

  it("accepts valid input", () => {
    expect(stageSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects target_conversion_pct above 1", () => {
    expect(
      stageSchema.safeParse({ ...valid, target_conversion_pct: 1.5 }).success,
    ).toBe(false);
  });

  it("rejects negative target_days", () => {
    expect(
      stageSchema.safeParse({ ...valid, target_days: -1 }).success,
    ).toBe(false);
  });

  it("rejects empty name", () => {
    expect(stageSchema.safeParse({ ...valid, name: "" }).success).toBe(false);
  });

  it("accepts terminal won/lost flags independently", () => {
    expect(
      stageSchema.safeParse({ ...valid, is_terminal_won: true }).success,
    ).toBe(true);
    expect(
      stageSchema.safeParse({ ...valid, is_terminal_lost: true }).success,
    ).toBe(true);
  });
});
