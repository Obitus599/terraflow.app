import { describe, expect, it } from "vitest";

import { clientSchema } from "./schema";

const validBase = {
  name: "Vortex Biotech",
  client_type: "recurring",
  monthly_aed: 1500,
  status: "active",
  health: "green",
  start_date: "",
  upsell_ideas: "",
  notes: "",
} as const;

describe("clientSchema", () => {
  it("accepts a minimal valid input", () => {
    const result = clientSchema.safeParse(validBase);
    expect(result.success).toBe(true);
  });

  it("rejects an empty name", () => {
    const result = clientSchema.safeParse({ ...validBase, name: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues.some((i) => i.path[0] === "name")).toBe(true);
    }
  });

  it("rejects an unknown client_type", () => {
    const result = clientSchema.safeParse({
      ...validBase,
      client_type: "weird",
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative monthly_aed", () => {
    const result = clientSchema.safeParse({
      ...validBase,
      monthly_aed: -100,
    });
    expect(result.success).toBe(false);
  });

  it("rejects non-integer monthly_aed", () => {
    const result = clientSchema.safeParse({
      ...validBase,
      monthly_aed: 1500.5,
    });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown status enum value", () => {
    const result = clientSchema.safeParse({ ...validBase, status: "WIP" });
    expect(result.success).toBe(false);
  });

  it("rejects an unknown health enum value", () => {
    const result = clientSchema.safeParse({ ...validBase, health: "amber" });
    expect(result.success).toBe(false);
  });

  it("accepts the full set of optional notes/upsell_ideas/start_date", () => {
    const result = clientSchema.safeParse({
      ...validBase,
      start_date: "2026-01-15",
      upsell_ideas: "AED 1k retainer add-on",
      notes: "Combined billing with PCCT",
    });
    expect(result.success).toBe(true);
  });
});
