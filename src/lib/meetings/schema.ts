import { z } from "zod";

// Empty-string normalization happens in the action.
export const meetingSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    description: z.string().optional(),
    starts_at: z.string().min(1, "Start time is required"),
    ends_at: z.string().min(1, "End time is required"),
    location: z.string().optional(),
    attendees: z.string().optional(),
    pipeline_deal_id: z.string().optional(),
    client_id: z.string().optional(),
    notes: z.string().optional(),
  })
  .refine(
    (v) => new Date(v.ends_at) > new Date(v.starts_at),
    { message: "End must be after start", path: ["ends_at"] },
  );

export type MeetingInput = z.infer<typeof meetingSchema>;
