import { describe, expect, it } from "vitest";

import { revenueSchema } from "./schema";

const valid = {
  received_date: "2026-04-15",
  client_id: "",
  invoice_number: "INV-001",
  amount_aed: 3000,
  entry_type: "project",
  notes: "",
} as const;

describe("revenueSchema", () => {
  it("accepts a valid entry", () => {
    expect(revenueSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty received_date", () => {
    expect(
      revenueSchema.safeParse({ ...valid, received_date: "" }).success,
    ).toBe(false);
  });

  it("rejects zero or negative amount", () => {
    expect(revenueSchema.safeParse({ ...valid, amount_aed: 0 }).success).toBe(
      false,
    );
    expect(revenueSchema.safeParse({ ...valid, amount_aed: -100 }).success).toBe(
      false,
    );
  });

  it("rejects unknown entry_type", () => {
    expect(
      revenueSchema.safeParse({ ...valid, entry_type: "barter" }).success,
    ).toBe(false);
  });

  it("accepts all four entry types", () => {
    for (const t of ["recurring", "project", "audit", "other"] as const) {
      expect(revenueSchema.safeParse({ ...valid, entry_type: t }).success).toBe(
        true,
      );
    }
  });
});
