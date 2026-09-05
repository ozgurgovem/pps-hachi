import { REFERENCE_ROLES } from "../../domain/model";
import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { ActionItemEditor } from "./Editor";
import { ACTION_ITEM_FIELDS } from "./fields";
import { renderActionItemToA3 } from "./renderToA3";
import { ActionItemPayloadSchema, type ActionItemPayload } from "./schema";

export const ACTION_ITEM_METHOD_ID = "action-item";

export const actionItemMethod: MethodPlugin<ActionItemPayload> = {
  id: ACTION_ITEM_METHOD_ID,
  steps: [6],
  tier: "recommended",
  nameKey: "methods.actionItem.name",
  useWhenKey: "methods.actionItem.useWhen",
  schema: ActionItemPayloadSchema,
  Editor: ActionItemEditor,
  createEmptyPayload: () => emptyFieldFormValues(ACTION_ITEM_FIELDS),
  renderToA3: renderActionItemToA3,
  /** SPEC.md §4.2: "an action holds `countermeasureId`" — singular. */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.countermeasure,
      labelKey: "methods.actionItem.references.countermeasure.label",
      emptyKey: "methods.actionItem.references.countermeasure.empty",
      fromSteps: [5],
      multiple: false,
    },
  ],
  aiProposal: { promptVersion: "v1" },
};
