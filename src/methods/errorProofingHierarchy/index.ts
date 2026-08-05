import { REFERENCE_ROLES } from "../../domain/model";
import type { MethodPlugin } from "../types";
import { ErrorProofingHierarchyEditor } from "./Editor";
import { renderErrorProofingHierarchyToA3 } from "./renderToA3";
import { ErrorProofingHierarchyPayloadSchema, type ErrorProofingHierarchyPayload } from "./schema";

export const ERROR_PROOFING_HIERARCHY_METHOD_ID = "error-proofing-hierarchy";

export const errorProofingHierarchyMethod: MethodPlugin<ErrorProofingHierarchyPayload> = {
  id: ERROR_PROOFING_HIERARCHY_METHOD_ID,
  steps: [5],
  nameKey: "methods.errorProofingHierarchy.name",
  useWhenKey: "methods.errorProofingHierarchy.useWhen",
  schema: ErrorProofingHierarchyPayloadSchema,
  Editor: ErrorProofingHierarchyEditor,
  createEmptyPayload: () => ({ level: "eliminate", note: "" }),
  renderToA3: renderErrorProofingHierarchyToA3,
  /**
   * Same step as its target (Step 5 → Step 5's countermeasure) — the first
   * same-step reference in the registry. D-116 never restricted references
   * to cross-step; the prior four (6b) all happened to point backward at an
   * earlier step because that's the shape of their domain relation. This one
   * genuinely rates *this* countermeasure, in the same step it lives in.
   */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.countermeasure,
      labelKey: "methods.errorProofingHierarchy.references.countermeasure.label",
      emptyKey: "methods.errorProofingHierarchy.references.countermeasure.empty",
      fromSteps: [5],
      multiple: false,
    },
  ],
};
