import { describe, expect, it } from "vitest";

import { visibleNavItems } from "./nav-items";

describe("visibleNavItems", () => {
  it("returns the full core for a team member (no /settings)", () => {
    const items = visibleNavItems("team");
    const hrefs = items.map((i) => i.href);
    expect(hrefs).toEqual([
      "/",
      "/tasks",
      "/calendar",
      "/pipeline",
      "/funnels",
      "/clients",
      "/revenue",
      "/cash-flow",
      "/cold-email",
      "/team",
      "/goals",
    ]);
  });

  it("returns the full core plus /settings for admin", () => {
    const items = visibleNavItems("admin");
    expect(items.map((i) => i.href)).toEqual([
      "/",
      "/tasks",
      "/calendar",
      "/pipeline",
      "/funnels",
      "/clients",
      "/revenue",
      "/cash-flow",
      "/cold-email",
      "/team",
      "/goals",
      "/settings",
    ]);
  });

  it("hides /settings from team (admin-only)", () => {
    const teamHrefs = visibleNavItems("team").map((i) => i.href);
    expect(teamHrefs).not.toContain("/settings");
  });

  it("includes a Home item with exact matching", () => {
    const home = visibleNavItems("admin").find((i) => i.href === "/");
    expect(home).toBeDefined();
    expect(home?.exact).toBe(true);
  });
});
