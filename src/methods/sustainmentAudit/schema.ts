import { z } from "zod";

/**
 * TEMPLATE_ANALYSIS.md §13.1 (Effectiveness Check page): Sustainment
 * Audits — a periodic audit record, one row per audit event. D-115: uses
 * the shared row-table substrate. Loose per D-51.
 */
export const SustainmentAuditRowSchema = z.looseObject({
  id: z.string(),
  auditDate: z.string(),
  areaLine: z.string(),
  standardChecked: z.string(),
  sampleSize: z.string(),
  conforming: z.string(),
  nonconforming: z.string(),
  compliancePercent: z.string(),
  auditor: z.string(),
  finding: z.string(),
  reactionActionId: z.string(),
  nextAudit: z.string(),
  status: z.string(),
});

export const SustainmentAuditPayloadSchema = z.looseObject({
  rows: z.array(SustainmentAuditRowSchema),
});

export type SustainmentAuditRow = z.infer<typeof SustainmentAuditRowSchema>;
export type SustainmentAuditPayload = z.infer<typeof SustainmentAuditPayloadSchema>;
