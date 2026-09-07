import { farplas7StepTr } from "./farplas-7step-tr";
import { pps8StepAuto } from "./pps-8step-auto";
import type { A3Template } from "./types";

/**
 * Faz 11/L1 (D-223 §2.4): this dilim's one real new architecture mechanism —
 * `a3Preview.ts` used to hardcode `farplas7StepTr` and never read
 * `project.templateId` at all (D-223's own §0 finding: template selection
 * was dead code). `farplas-7step-tr` stays registered as a
 * legacy-compatibility template (D-157) so an existing 7-step `.ppsx` still
 * opens and exports; `pps-8step-auto` is the new default (D-157/D-10).
 */
const TEMPLATE_REGISTRY: Readonly<Record<string, A3Template>> = {
  [farplas7StepTr.id]: farplas7StepTr,
  [pps8StepAuto.id]: pps8StepAuto,
};

/** D-157: new projects default to this template. */
export const DEFAULT_TEMPLATE_ID = pps8StepAuto.id;

/**
 * An unrecognised `templateId` (an older/corrupted `.ppsx`, or one written
 * by a future build this one doesn't know about) falls back to
 * `farplas-7step-tr` rather than throwing — the same "open anyway, degrade
 * gracefully" posture D-52/P-05 already established for an unknown
 * `methodId`. `buildProjectA3Layout`'s own caller never sees the fallback
 * happen; the export just uses a template the project's `templateId` didn't
 * actually name.
 */
export function getTemplateById(templateId: string): A3Template {
  return TEMPLATE_REGISTRY[templateId] ?? farplas7StepTr;
}

export function listTemplates(): readonly A3Template[] {
  return Object.values(TEMPLATE_REGISTRY);
}
