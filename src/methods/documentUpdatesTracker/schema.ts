import { z } from "zod";

/**
 * D-122's fixed-category pattern (`tpmLossTaxonomy`), one layer richer: each
 * of the seven fixed document types (`documentTypes.ts`) carries the same
 * nine-field record (`fields.ts`) instead of `tpmLossTaxonomy`'s two-field
 * tag. Every field is a `FieldFormValues`-shaped `string`, matching
 * `shared/fieldForm.ts`'s convention. Loose per D-51.
 */
export const DocumentUpdateRowSchema = z.looseObject({
  updateRequired: z.string(),
  docId: z.string(),
  revision: z.string(),
  owner: z.string(),
  dueDate: z.string(),
  status: z.string(),
  approval: z.string(),
  evidence: z.string(),
  customerSubmission: z.string(),
});

export type DocumentUpdateRow = z.infer<typeof DocumentUpdateRowSchema>;

export const DocumentUpdatesTrackerPayloadSchema = z.looseObject({
  pfmea: DocumentUpdateRowSchema,
  controlPlan: DocumentUpdateRowSchema,
  workInstruction: DocumentUpdateRowSchema,
  inspectionStandard: DocumentUpdateRowSchema,
  trainingCompetence: DocumentUpdateRowSchema,
  layeredProcessAudit: DocumentUpdateRowSchema,
  apqpPpapRecord: DocumentUpdateRowSchema,
});

export type DocumentUpdatesTrackerPayload = z.infer<typeof DocumentUpdatesTrackerPayloadSchema>;
