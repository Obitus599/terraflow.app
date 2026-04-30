import { describe, expect, it } from "vitest";

import { taskSchema } from "./schema";

const valid = {
  title: "Vortex SEO · April keyword report",
  owner_id: "00000000-0000-4000-8000-000000000001",
  client_id: "",
  status: "in_progress",
  priority: "p1",
  due_date: "2026-05-15",
  estimated_hours: 4,
  actual_hours: 0,
  notes: "",
  category: "Vortex SEO",
} as const;

describe("taskSchema", () => {
  it("accepts a valid task", () => {
    expect(taskSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(taskSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects empty owner_id (owner is required)", () => {
    expect(taskSchema.safeParse({ ...valid, owner_id: "" }).success).toBe(false);
  });

  it("accepts an empty client_id (internal task)", () => {
    expect(taskSchema.safeParse({ ...valid, client_id: "" }).success).toBe(true);
  });

  it("rejects unknown status", () => {
    expect(taskSchema.safeParse({ ...valid, status: "WIP" }).success).toBe(false);
  });

  it("rejects unknown priority", () => {
    expect(taskSchema.safeParse({ ...valid, priority: "p3" }).success).toBe(false);
  });

  it("rejects negative estimated_hours", () => {
    expect(taskSchema.safeParse({ ...valid, estimated_hours: -1 }).success).toBe(
      false,
    );
  });

  it("accepts fractional hours (0.25 increments)", () => {
    const result = taskSchema.safeParse({ ...valid, estimated_hours: 0.25 });
    expect(result.success).toBe(true);
  });
});
