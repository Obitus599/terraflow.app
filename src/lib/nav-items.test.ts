import { describe, expect, it } from "vitest";

import { visibleNavItems } from "./nav-items";

describe("visibleNavItems", () => {
  it("returns the live core for a team member", () => {
    const items = visibleNavItems("team");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toEqual([
      "/",
      "/tasks",
      "/pipeline",
      "/clients",
      "/revenue",
      "/cash-flow",
      "/cold-email",
    ]);
  });

  it("returns the same set for admin (admin-only items still gated by comingSoon for now)", () => {
    const items = visibleNavItems("admin");
    expect(items.map((i) => i.href)).toEqual([
      "/",
      "/tasks",
      "/pipeline",
      "/clients",
      "/revenue",
      "/cash-flow",
      "/cold-email",
    ]);
  });

  it("hides comingSoon items from everyone", () => {
    const adminHrefs = visibleNavItems("admin").map((i) => i.href);
    expect(adminHrefs).not.toContain("/team");
    expect(adminHrefs).not.toContain("/goals");
    expect(adminHrefs).not.toContain("/settings");
  });

  it("includes a Home item with exact matching", () => {
    const home = visibleNavItems("admin").find((i) => i.href === "/");
    expect(home).toBeDefined();
    expect(home?.exact).toBe(true);
  });
});
