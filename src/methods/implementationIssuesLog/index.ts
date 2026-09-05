import type { MethodPlugin } from "../types";
import { ImplementationIssuesLogEditor } from "./Editor";
import { renderImplementationIssuesLogToA3 } from "./renderToA3";
import { ImplementationIssuesLogPayloadSchema, type ImplementationIssuesLogPayload } from "./schema";

export const IMPLEMENTATION_ISSUES_LOG_METHOD_ID = "implementation-issues-log";

export const implementationIssuesLogMethod: MethodPlugin<ImplementationIssuesLogPayload> = {
  id: IMPLEMENTATION_ISSUES_LOG_METHOD_ID,
  steps: [6],
  nameKey: "methods.implementationIssuesLog.name",
  useWhenKey: "methods.implementationIssuesLog.useWhen",
  schema: ImplementationIssuesLogPayloadSchema,
  Editor: ImplementationIssuesLogEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderImplementationIssuesLogToA3,
  aiProposal: { promptVersion: "v1" },
};
