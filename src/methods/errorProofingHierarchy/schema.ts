import { z } from "zod";
import { ERROR_PROOFING_LEVELS } from "./levels";

/** SPEC.md §1.3 (Step 5). Loose per D-51. */
export const ErrorProofingHierarchyPayloadSchema = z.looseObject({
  level: z.enum(ERROR_PROOFING_LEVELS),
  note: z.string(),
});

export type ErrorProofingHierarchyPayload = z.infer<typeof ErrorProofingHierarchyPayloadSchema>;
