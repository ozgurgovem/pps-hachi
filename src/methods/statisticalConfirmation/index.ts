import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { StatisticalConfirmationEditor } from "./Editor";
import { STATISTICAL_CONFIRMATION_FIELDS } from "./fields";
import { renderStatisticalConfirmationToA3 } from "./renderToA3";
import { StatisticalConfirmationPayloadSchema, type StatisticalConfirmationPayload } from "./schema";

export const STATISTICAL_CONFIRMATION_METHOD_ID = "statistical-confirmation";

export const statisticalConfirmationMethod: MethodPlugin<StatisticalConfirmationPayload> = {
  id: STATISTICAL_CONFIRMATION_METHOD_ID,
  steps: [7],
  nameKey: "methods.statisticalConfirmation.name",
  useWhenKey: "methods.statisticalConfirmation.useWhen",
  schema: StatisticalConfirmationPayloadSchema,
  Editor: StatisticalConfirmationEditor,
  createEmptyPayload: () => emptyFieldFormValues(STATISTICAL_CONFIRMATION_FIELDS),
  renderToA3: renderStatisticalConfirmationToA3,
  aiProposal: { promptVersion: "v1" },
};
