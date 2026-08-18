import type { A3Language } from "../../a3/methodContract";

/**
 * SPEC.md §1.3 (Step 5): "Error-proofing hierarchy selector (strongest →
 * weakest): Eliminate → Substitute → Prevent (poka-yoke) → Detect → Warn →
 * Procedure/Training. Display the strength visually; nudge the user
 * upward." Order here is the ranking itself — `strengthOf` and the editor's
 * strength bar both read position in this array, so the hierarchy stays a
 * single source of truth rather than a rank number duplicated elsewhere.
 */
export const ERROR_PROOFING_LEVELS = [
  "eliminate",
  "substitute",
  "prevent",
  "detect",
  "warn",
  "procedure",
] as const;

export type ErrorProofingLevel = (typeof ERROR_PROOFING_LEVELS)[number];

export const ERROR_PROOFING_LEVEL_OPTIONS = ERROR_PROOFING_LEVELS.map((level) => ({
  value: level,
  labelKey: `methods.errorProofingHierarchy.levels.${level}`,
}));

/** A3-side labels, keyed by `A3Language` (D-188/P-26) — `renderToA3` is i18n-free (D-43). */
export const ERROR_PROOFING_LEVEL_EXPORT_LABELS: Readonly<Record<ErrorProofingLevel, Readonly<Record<A3Language, string>>>> = {
  eliminate: { tr: "Ortadan kaldır", en: "Eliminate" },
  substitute: { tr: "İkame et", en: "Substitute" },
  prevent: { tr: "Önle (poka-yoke)", en: "Prevent (poka-yoke)" },
  detect: { tr: "Tespit et", en: "Detect" },
  warn: { tr: "Uyar", en: "Warn" },
  procedure: { tr: "Prosedür/Eğitim", en: "Procedure/Training" },
};

/** 1 = strongest (Eliminate), 6 = weakest (Procedure/Training). */
export function strengthOf(level: string): number | undefined {
  const index = ERROR_PROOFING_LEVELS.indexOf(level as ErrorProofingLevel);
  return index === -1 ? undefined : index + 1;
}
