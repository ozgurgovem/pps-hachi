import type { A3BlockContent, A3EntrySummary, A3TextLine } from "../../a3/methodContract";
import { TPM_LOSS_CATEGORIES, type TpmLossCategory, type TpmLossSeverity } from "./categories";
import type { TpmLossTaxonomyPayload } from "./schema";

const CATEGORY_LABELS: Readonly<Record<TpmLossCategory, string>> = {
  workSafety: "Work Safety",
  cost: "Cost",
  productivity: "Productivity",
  quality: "Quality",
  maintenance: "Maintenance",
  humanResources: "Human Resources",
  environment: "Environment",
};

const SEVERITY_LABELS: Readonly<Record<TpmLossSeverity, string>> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function renderTpmLossTaxonomyToA3(payload: TpmLossTaxonomyPayload, entry: A3EntrySummary): A3BlockContent {
  const tagLines: A3TextLine[] = TPM_LOSS_CATEGORIES.filter((category) => payload[category].applies).map(
    (category) => ({ text: `${CATEGORY_LABELS[category]} — ${SEVERITY_LABELS[payload[category].severity]}` }),
  );

  return {
    lines: [{ text: entry.title, bold: true }, ...tagLines],
  };
}
