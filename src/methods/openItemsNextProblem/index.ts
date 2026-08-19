import type { MethodPlugin } from "../types";
import { OpenItemsNextProblemEditor } from "./Editor";
import { renderOpenItemsNextProblemToA3 } from "./renderToA3";
import { OpenItemsNextProblemPayloadSchema, type OpenItemsNextProblemPayload } from "./schema";

export const OPEN_ITEMS_NEXT_PROBLEM_METHOD_ID = "open-items-next-problem";

export const openItemsNextProblemMethod: MethodPlugin<OpenItemsNextProblemPayload> = {
  id: OPEN_ITEMS_NEXT_PROBLEM_METHOD_ID,
  steps: [8],
  nameKey: "methods.openItemsNextProblem.name",
  useWhenKey: "methods.openItemsNextProblem.useWhen",
  schema: OpenItemsNextProblemPayloadSchema,
  Editor: OpenItemsNextProblemEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderOpenItemsNextProblemToA3,
};
