import type { A3BlockContent, A3EntrySummary, A3Language, A3TextLine } from "../../a3/methodContract";
import { resolveA3Language } from "../../a3/methodContract";
import { TPM_LOSS_CATEGORIES, type TpmLossCategory, type TpmLossSeverity } from "./categories";
import type { TpmLossTaxonomyPayload } from "./schema";

/** D-188/P-26: matches `methods.tpmLossTaxonomy.categories.*`'s own editor translations. */
const CATEGORY_LABELS: Readonly<Record<TpmLossCategory, Readonly<Record<A3Language, string>>>> = {
  workSafety: { tr: "İş Güvenliği", en: "Work Safety" },
  cost: { tr: "Maliyet", en: "Cost" },
  productivity: { tr: "Verimlilik", en: "Productivity" },
  quality: { tr: "Kalite", en: "Quality" },
  maintenance: { tr: "Bakım", en: "Maintenance" },
  humanResources: { tr: "İnsan Kaynakları", en: "Human Resources" },
  environment: { tr: "Çevre", en: "Environment" },
};

/** D-188/P-26: matches `methods.tpmLossTaxonomy.severities.*`'s own editor translations. */
const SEVERITY_LABELS: Readonly<Record<TpmLossSeverity, Readonly<Record<A3Language, string>>>> = {
  low: { tr: "Düşük", en: "Low" },
  medium: { tr: "Orta", en: "Medium" },
  high: { tr: "Yüksek", en: "High" },
};

export function renderTpmLossTaxonomyToA3(payload: TpmLossTaxonomyPayload, entry: A3EntrySummary): A3BlockContent {
  const language = resolveA3Language(entry);
  const tagLines: A3TextLine[] = TPM_LOSS_CATEGORIES.filter((category) => payload[category].applies).map(
    (category) => ({
      text: `${CATEGORY_LABELS[category][language]} — ${SEVERITY_LABELS[payload[category].severity][language]}`,
    }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...tagLines],
  };
}
