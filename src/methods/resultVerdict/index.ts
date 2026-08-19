import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { ResultVerdictEditor } from "./Editor";
import { RESULT_VERDICT_FIELDS } from "./fields";
import { renderResultVerdictToA3 } from "./renderToA3";
import { ResultVerdictPayloadSchema, type ResultVerdictPayload } from "./schema";

export const RESULT_VERDICT_METHOD_ID = "result-verdict";

export const resultVerdictMethod: MethodPlugin<ResultVerdictPayload> = {
  id: RESULT_VERDICT_METHOD_ID,
  steps: [7],
  nameKey: "methods.resultVerdict.name",
  useWhenKey: "methods.resultVerdict.useWhen",
  schema: ResultVerdictPayloadSchema,
  Editor: ResultVerdictEditor,
  createEmptyPayload: () => emptyFieldFormValues(RESULT_VERDICT_FIELDS),
  renderToA3: renderResultVerdictToA3,
};
