import { REFERENCE_ROLES } from "../../domain/model";
import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { IcaPcaTransitionEditor } from "./Editor";
import { ICA_PCA_TRANSITION_FIELDS } from "./fields";
import { renderIcaPcaTransitionToA3 } from "./renderToA3";
import { IcaPcaTransitionPayloadSchema, type IcaPcaTransitionPayload } from "./schema";

export const ICA_PCA_TRANSITION_METHOD_ID = "ica-pca-transition";

export const icaPcaTransitionMethod: MethodPlugin<IcaPcaTransitionPayload> = {
  id: ICA_PCA_TRANSITION_METHOD_ID,
  steps: [6],
  nameKey: "methods.icaPcaTransition.name",
  useWhenKey: "methods.icaPcaTransition.useWhen",
  schema: IcaPcaTransitionPayloadSchema,
  Editor: IcaPcaTransitionEditor,
  createEmptyPayload: () => emptyFieldFormValues(ICA_PCA_TRANSITION_FIELDS),
  renderToA3: renderIcaPcaTransitionToA3,
  /**
   * The only method holding two roles, and the reason D-116's loose `role`
   * string matters: `containment` is a fourth constant, added without a
   * schema change or a migration. §4.2 names three relations; the interim
   * side of an ICA→PCA pair is not one of them, and pretending it was one of
   * the three would make the traceability view read the chain wrong.
   */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.containment,
      labelKey: "methods.icaPcaTransition.references.containment.label",
      emptyKey: "methods.icaPcaTransition.references.containment.empty",
      fromSteps: [1],
      multiple: false,
    },
    {
      role: REFERENCE_ROLES.countermeasure,
      labelKey: "methods.icaPcaTransition.references.countermeasure.label",
      emptyKey: "methods.icaPcaTransition.references.countermeasure.empty",
      fromSteps: [5],
      multiple: false,
    },
  ],
  aiProposal: { promptVersion: "v1" },
};
