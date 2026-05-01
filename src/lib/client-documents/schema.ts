import { z } from "zod";

export const DOC_CATEGORIES = [
  "contracts",
  "proposals",
  "onboarding",
  "deliverables",
  "misc",
] as const;

export type DocCategory = (typeof DOC_CATEGORIES)[number];

export const DOC_CATEGORY_LABELS: Record<DocCategory, string> = {
  contracts: "Contracts",
  proposals: "Proposals",
  onboarding: "Onboarding",
  deliverables: "Deliverables",
  misc: "Misc",
};

export const DOC_CATEGORY_DESCRIPTIONS: Record<DocCategory, string> = {
  contracts: "MOUs, MSAs, NDAs, signed agreements.",
  proposals: "Proposals, pricing sheets, pitch decks.",
  onboarding: "Kickoff briefs, intake forms, brand guidelines.",
  deliverables: "Final reports, creative output, exports.",
  misc: "Anything that doesn't fit elsewhere.",
};

// Server-side accepts MAX_BYTES; the bucket itself is configured to 25 MB.
export const MAX_DOC_BYTES = 25 * 1024 * 1024;

export const ALLOWED_MIME_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/svg+xml",
  "text/plain",
  "text/csv",
] as const;

export const uploadDocSchema = z.object({
  client_id: z.string().min(1),
  category: z.enum(DOC_CATEGORIES),
});
