import { describe, expect, it } from "vitest";

import { coldEmailSchema } from "./schema";

const valid = {
  prospect_name: "Servane Collette",
  company: "Invicta Med",
  email: "servane@invictamed.com",
  subject: "Quick thought on Invicta Med",
  notes: "Hand-personalized · Founding Clinic pitch",
} as const;

describe("coldEmailSchema", () => {
  it("accepts a valid prospect", () => {
    expect(coldEmailSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty prospect_name", () => {
    expect(
      coldEmailSchema.safeParse({ ...valid, prospect_name: "" }).success,
    ).toBe(false);
  });

  it("rejects malformed email", () => {
    expect(
      coldEmailSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });

  it("requires email (no empty string)", () => {
    expect(
      coldEmailSchema.safeParse({ ...valid, email: "" }).success,
    ).toBe(false);
  });

  it("treats company / subject / notes as optional", () => {
    const result = coldEmailSchema.safeParse({
      prospect_name: "Khaled Amairi",
      email: "khaled@revamedicalgroup.com",
    });
    expect(result.success).toBe(true);
  });
});
