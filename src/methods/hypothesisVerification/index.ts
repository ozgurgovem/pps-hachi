import { REFERENCE_ROLES } from "../../domain/model";
import type { MethodPlugin } from "../types";
import { HypothesisVerificationEditor } from "./Editor";
import { renderHypothesisVerificationToA3 } from "./renderToA3";
import { HypothesisVerificationPayloadSchema, type HypothesisVerificationPayload } from "./schema";

export const HYPOTHESIS_VERIFICATION_METHOD_ID = "hypothesis-verification";

export const hypothesisVerificationMethod: MethodPlugin<HypothesisVerificationPayload> = {
  id: HYPOTHESIS_VERIFICATION_METHOD_ID,
  steps: [4],
  nameKey: "methods.hypothesisVerification.name",
  useWhenKey: "methods.hypothesisVerification.useWhen",
  schema: HypothesisVerificationPayloadSchema,
  Editor: HypothesisVerificationEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderHypothesisVerificationToA3,
  /**
   * SPEC.md §4.2: "a root cause holds `pointOfCauseId`". This table is the
   * root-cause carrier, so it is the entry that holds that reference — one
   * point of cause per table, hence `multiple: false`.
   */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.pointOfCause,
      labelKey: "methods.hypothesisVerification.references.pointOfCause.label",
      emptyKey: "methods.hypothesisVerification.references.pointOfCause.empty",
      fromSteps: [2],
      multiple: false,
    },
  ],
};
