import type { MethodPlugin } from "../types";
import { CheckSheetEditor } from "./Editor";
import { renderCheckSheetToA3 } from "./renderToA3";
import { CheckSheetPayloadSchema, type CheckSheetPayload } from "./schema";

export const CHECK_SHEET_METHOD_ID = "check-sheet";

export const checkSheetMethod: MethodPlugin<CheckSheetPayload> = {
  id: CHECK_SHEET_METHOD_ID,
  steps: [2],
  nameKey: "methods.checkSheet.name",
  useWhenKey: "methods.checkSheet.useWhen",
  schema: CheckSheetPayloadSchema,
  Editor: CheckSheetEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderCheckSheetToA3,
  aiProposal: { promptVersion: "v1" },
};
