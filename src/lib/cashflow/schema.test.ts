import { describe, expect, it } from "vitest";

import { bankBalanceSchema, cashFlowSchema } from "./schema";

describe("cashFlowSchema", () => {
  const valid = {
    entry_date: "2026-04-15",
    direction: "out" as const,
    category: "tools" as const,
    description: "Vercel Pro subscription",
    amount_aed: 100,
    notes: "",
  };

  it("accepts a valid out-entry", () => {
    expect(cashFlowSchema.safeParse(valid).success).toBe(true);
  });

  it("accepts a valid in-entry", () => {
    expect(
      cashFlowSchema.safeParse({
        ...valid,
        direction: "in",
        category: "revenue",
      }).success,
    ).toBe(true);
  });

  it("rejects unknown direction", () => {
    expect(
      cashFlowSchema.safeParse({ ...valid, direction: "sideways" }).success,
    ).toBe(false);
  });

  it("rejects unknown category", () => {
    expect(
      cashFlowSchema.safeParse({ ...valid, category: "swag" }).success,
    ).toBe(false);
  });

  it("rejects zero or negative amount", () => {
    expect(cashFlowSchema.safeParse({ ...valid, amount_aed: 0 }).success).toBe(
      false,
    );
  });

  it("rejects empty entry_date", () => {
    expect(
      cashFlowSchema.safeParse({ ...valid, entry_date: "" }).success,
    ).toBe(false);
  });
});

describe("bankBalanceSchema", () => {
  it("accepts zero", () => {
    expect(bankBalanceSchema.safeParse({ current_aed: 0 }).success).toBe(true);
  });

  it("accepts a positive integer", () => {
    expect(bankBalanceSchema.safeParse({ current_aed: 50000 }).success).toBe(
      true,
    );
  });

  it("rejects negatives (overdraft tracked elsewhere)", () => {
    expect(bankBalanceSchema.safeParse({ current_aed: -100 }).success).toBe(
      false,
    );
  });

  it("rejects fractional values", () => {
    expect(bankBalanceSchema.safeParse({ current_aed: 100.5 }).success).toBe(
      false,
    );
  });
});
