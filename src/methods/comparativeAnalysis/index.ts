import type { MethodPlugin } from "../types";
import { ComparativeAnalysisEditor } from "./Editor";
import { renderComparativeAnalysisToA3 } from "./renderToA3";
import { ComparativeAnalysisPayloadSchema, type ComparativeAnalysisPayload } from "./schema";

export const COMPARATIVE_ANALYSIS_METHOD_ID = "comparative-analysis";

export const comparativeAnalysisMethod: MethodPlugin<ComparativeAnalysisPayload> = {
  id: COMPARATIVE_ANALYSIS_METHOD_ID,
  steps: [4],
  nameKey: "methods.comparativeAnalysis.name",
  useWhenKey: "methods.comparativeAnalysis.useWhen",
  schema: ComparativeAnalysisPayloadSchema,
  Editor: ComparativeAnalysisEditor,
  createEmptyPayload: () => ({ subject: "", rows: [] }),
  renderToA3: renderComparativeAnalysisToA3,
  aiProposal: { promptVersion: "v1" },
};
