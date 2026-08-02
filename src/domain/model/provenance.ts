import { z } from "zod";

/** §8.13 / D-18: required on every entry, never optional — "the AI wrote it" is not an answer. */
export const ProvenanceSchema = z.looseObject({
  origin: z.enum(["human", "ai-accepted", "ai-edited"]),
  model: z
    .looseObject({
      providerId: z.string(),
      modelId: z.string(),
      promptVersion: z.string(),
    })
    .optional(),
  generatedAt: z.iso.datetime().optional(),
  acceptedBy: z.string().optional(),
  acceptedAt: z.iso.datetime().optional(),
  editDistance: z.number().min(0).max(1).optional(),
});

export type Provenance = z.infer<typeof ProvenanceSchema>;
