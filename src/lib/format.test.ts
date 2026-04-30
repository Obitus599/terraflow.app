import { describe, expect, it } from "vitest";

import { formatAed, formatAedCompact, initialsOf } from "./format";

describe("formatAed", () => {
  it("renders a positive amount with no decimals", () => {
    expect(formatAed(1500)).toMatch(/^AED\s?1,500$/);
  });

  it("renders zero", () => {
    expect(formatAed(0)).toMatch(/^AED\s?0$/);
  });

  it("renders large amounts with grouping separators", () => {
    expect(formatAed(15000)).toMatch(/^AED\s?15,000$/);
    expect(formatAed(1500000)).toMatch(/^AED\s?1,500,000$/);
  });

  it("returns em-dash for null/undefined", () => {
    expect(formatAed(null)).toBe("—");
    expect(formatAed(undefined)).toBe("—");
  });
});

describe("formatAedCompact", () => {
  it("uses K suffix at >= 1000", () => {
    expect(formatAedCompact(1500)).toBe("AED 1.5K");
    expect(formatAedCompact(15000)).toBe("AED 15K");
    expect(formatAedCompact(150000)).toBe("AED 150K");
  });

  it("drops the decimal when divisible by 1000", () => {
    expect(formatAedCompact(2000)).toBe("AED 2K");
  });

  it("falls back to currency formatting under 1000", () => {
    expect(formatAedCompact(999)).toMatch(/^AED\s?999$/);
    expect(formatAedCompact(0)).toMatch(/^AED\s?0$/);
  });

  it("returns em-dash for null/undefined", () => {
    expect(formatAedCompact(null)).toBe("—");
    expect(formatAedCompact(undefined)).toBe("—");
  });
});

describe("initialsOf", () => {
  it("takes first letter of first two words, uppercased", () => {
    expect(initialsOf("Alex Joseph")).toBe("AJ");
    expect(initialsOf("Maria Karakoulaki")).toBe("MK");
  });

  it("handles single names", () => {
    expect(initialsOf("Raj")).toBe("R");
    expect(initialsOf("morty")).toBe("M");
  });

  it("returns em-dash for null/undefined/empty", () => {
    expect(initialsOf(null)).toBe("—");
    expect(initialsOf(undefined)).toBe("—");
    expect(initialsOf("")).toBe("—");
  });

  it("caps at 2 characters", () => {
    expect(initialsOf("Alex Joseph Smith")).toBe("AJ");
  });
});
