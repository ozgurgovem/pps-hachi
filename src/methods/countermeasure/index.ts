import { REFERENCE_ROLES } from "../../domain/model";
import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { CountermeasureEditor } from "./Editor";
import { COUNTERMEASURE_FIELDS } from "./fields";
import { renderCountermeasureToA3 } from "./renderToA3";
import { CountermeasurePayloadSchema, type CountermeasurePayload } from "./schema";

export const COUNTERMEASURE_METHOD_ID = "countermeasure";

export const countermeasureMethod: MethodPlugin<CountermeasurePayload> = {
  id: COUNTERMEASURE_METHOD_ID,
  steps: [5],
  tier: "recommended",
  nameKey: "methods.countermeasure.name",
  useWhenKey: "methods.countermeasure.useWhen",
  schema: CountermeasurePayloadSchema,
  Editor: CountermeasureEditor,
  createEmptyPayload: () => emptyFieldFormValues(COUNTERMEASURE_FIELDS),
  renderToA3: renderCountermeasureToA3,
  /** SPEC.md §4.2: "a countermeasure holds `rootCauseIds[]`" — plural, hence `multiple: true`. */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.rootCause,
      labelKey: "methods.countermeasure.references.rootCause.label",
      emptyKey: "methods.countermeasure.references.rootCause.empty",
      fromSteps: [4],
      multiple: true,
    },
  ],
  aiProposal: { promptVersion: "v1" },
};
