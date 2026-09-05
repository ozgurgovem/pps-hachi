import type { MethodPlugin } from "../types";
import { TrialResultLogEditor } from "./Editor";
import { renderTrialResultLogToA3 } from "./renderToA3";
import { TrialResultLogPayloadSchema, type TrialResultLogPayload } from "./schema";

export const TRIAL_RESULT_LOG_METHOD_ID = "trial-result-log";

export const trialResultLogMethod: MethodPlugin<TrialResultLogPayload> = {
  id: TRIAL_RESULT_LOG_METHOD_ID,
  steps: [6],
  nameKey: "methods.trialResultLog.name",
  useWhenKey: "methods.trialResultLog.useWhen",
  schema: TrialResultLogPayloadSchema,
  Editor: TrialResultLogEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderTrialResultLogToA3,
  aiProposal: { promptVersion: "v1" },
};
