import { STEP_IDS } from "../../domain/model";
import type { MethodPlugin } from "../types";
import { GenericTextEditor } from "./Editor";
import { renderGenericTextToA3 } from "./renderToA3";
import { GenericTextPayloadSchema, type GenericTextPayload } from "./schema";

export const GENERIC_TEXT_METHOD_ID = "generic-text";

export const genericTextMethod: MethodPlugin<GenericTextPayload> = {
  id: GENERIC_TEXT_METHOD_ID,
  steps: STEP_IDS,
  nameKey: "methods.genericText.name",
  useWhenKey: "methods.genericText.useWhen",
  schema: GenericTextPayloadSchema,
  Editor: GenericTextEditor,
  createEmptyPayload: () => ({ text: "" }),
  renderToA3: renderGenericTextToA3,
};
