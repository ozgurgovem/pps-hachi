import type { A3Language } from "../../a3/methodContract";

/**
 * TEMPLATE_ANALYSIS.md §13.1 (Standardization, Yokoten & Lessons Learned
 * page) / §13.4 candidate 2: seven fixed document types the reference form
 * tracks separately. D-122's pattern (`tpmLossTaxonomy`) — a closed,
 * company-standard taxonomy, not a user-extensible row list, so the user
 * can add or remove entries no more than they could rename a TPM loss
 * category. Shipped `pfmeaLinkage` stays single-document-focused; this
 * tracks all seven independently (§2.1 candidate 2's own note).
 */
export const DOCUMENT_TYPES = [
  "pfmea",
  "controlPlan",
  "workInstruction",
  "inspectionStandard",
  "trainingCompetence",
  "layeredProcessAudit",
  "apqpPpapRecord",
] as const;

export type DocumentType = (typeof DOCUMENT_TYPES)[number];

/** i18next key for a document type's display label. */
export function documentTypeLabelKey(documentType: DocumentType): string {
  return `methods.documentUpdatesTracker.documentTypes.${documentType}`;
}

/** Export-side label, keyed by `A3Language` (D-188/P-26) — `renderToA3` is i18n-free (D-43). */
export const DOCUMENT_TYPE_EXPORT_LABELS: Readonly<Record<DocumentType, Readonly<Record<A3Language, string>>>> = {
  pfmea: { tr: "PFMEA", en: "PFMEA" },
  controlPlan: { tr: "Kontrol Planı", en: "Control Plan" },
  workInstruction: { tr: "Çalışma Talimatı", en: "Work Instruction" },
  inspectionStandard: { tr: "Kontrol Standardı", en: "Inspection Standard" },
  trainingCompetence: { tr: "Eğitim / Yetkinlik", en: "Training / Competence" },
  layeredProcessAudit: { tr: "Katmanlı Proses Denetimi", en: "Layered Process Audit" },
  apqpPpapRecord: { tr: "APQP / PPAP kaydı", en: "APQP / PPAP record" },
};
