import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { RealizedCostBenefitEditor } from "./Editor";
import { REALIZED_COST_BENEFIT_FIELDS } from "./fields";
import { renderRealizedCostBenefitToA3 } from "./renderToA3";
import { RealizedCostBenefitPayloadSchema, type RealizedCostBenefitPayload } from "./schema";

export const REALIZED_COST_BENEFIT_METHOD_ID = "realized-cost-benefit";

export const realizedCostBenefitMethod: MethodPlugin<RealizedCostBenefitPayload> = {
  id: REALIZED_COST_BENEFIT_METHOD_ID,
  steps: [7],
  nameKey: "methods.realizedCostBenefit.name",
  useWhenKey: "methods.realizedCostBenefit.useWhen",
  schema: RealizedCostBenefitPayloadSchema,
  Editor: RealizedCostBenefitEditor,
  createEmptyPayload: () => emptyFieldFormValues(REALIZED_COST_BENEFIT_FIELDS),
  renderToA3: renderRealizedCostBenefitToA3,
};
