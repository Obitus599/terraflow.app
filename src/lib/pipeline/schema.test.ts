import { describe, expect, it } from "vitest";

import { dealSchema } from "./schema";

const valid = {
  prospect_name: "Khaled Amairi",
  company: "Clinica Reva Medical Group",
  source: "cold_email",
  stage: "first_touch",
  confidence: "pipe",
  expected_aed_monthly: 1500,
  expected_aed_one_time: 0,
  expected_close_month: "2026-06-30",
  last_touch: "2026-04-29",
  next_action: "Follow up by phone",
  owner_id: "",
  notes: "",
  won_lost_reason: "",
} as const;

describe("dealSchema", () => {
  it("accepts a valid deal", () => {
    expect(dealSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty prospect_name", () => {
    expect(
      dealSchema.safeParse({ ...valid, prospect_name: "" }).success,
    ).toBe(false);
  });

  it("rejects unknown source", () => {
    expect(dealSchema.safeParse({ ...valid, source: "carrier_pigeon" }).success).toBe(
      false,
    );
  });

  it("accepts each valid stage", () => {
    const stages = [
      "first_touch",
      "replied",
      "call_booked",
      "proposal_sent",
      "mou_signed",
      "kickoff",
      "won",
      "lost",
    ] as const;
    for (const stage of stages) {
      expect(dealSchema.safeParse({ ...valid, stage }).success).toBe(true);
    }
  });

  it("rejects unknown confidence", () => {
    expect(dealSchema.safeParse({ ...valid, confidence: "maybe" }).success).toBe(
      false,
    );
  });

  it("rejects negative expected amounts", () => {
    expect(
      dealSchema.safeParse({ ...valid, expected_aed_monthly: -1 }).success,
    ).toBe(false);
    expect(
      dealSchema.safeParse({ ...valid, expected_aed_one_time: -1 }).success,
    ).toBe(false);
  });
});
