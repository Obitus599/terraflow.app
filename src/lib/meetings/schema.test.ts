import { describe, expect, it } from "vitest";

import { meetingSchema } from "./schema";

const valid = {
  title: "Founding clinic call",
  description: "Walk through the founding-clinic offer",
  starts_at: "2026-05-05T10:00",
  ends_at: "2026-05-05T11:00",
  location: "Zoom",
  attendees: "alex@terraflow.studio,prospect@example.com",
  pipeline_deal_id: "",
  client_id: "",
  notes: "",
} as const;

describe("meetingSchema", () => {
  it("accepts a valid meeting", () => {
    expect(meetingSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects empty title", () => {
    expect(meetingSchema.safeParse({ ...valid, title: "" }).success).toBe(false);
  });

  it("rejects empty start time", () => {
    expect(
      meetingSchema.safeParse({ ...valid, starts_at: "" }).success,
    ).toBe(false);
  });

  it("rejects when end is not after start", () => {
    const same = meetingSchema.safeParse({
      ...valid,
      ends_at: valid.starts_at,
    });
    expect(same.success).toBe(false);

    const before = meetingSchema.safeParse({
      ...valid,
      ends_at: "2026-05-05T09:30",
    });
    expect(before.success).toBe(false);
  });

  it("treats description, location, attendees as optional", () => {
    expect(
      meetingSchema.safeParse({
        title: "x",
        starts_at: "2026-05-05T10:00",
        ends_at: "2026-05-05T11:00",
      }).success,
    ).toBe(true);
  });
});
