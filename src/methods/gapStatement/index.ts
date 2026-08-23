import type { MethodPlugin } from "../types";
import { GapStatementEditor } from "./Editor";
import { renderGapStatementToA3 } from "./renderToA3";
import { GapStatementPayloadSchema, type GapStatementPayload } from "./schema";

export const GAP_STATEMENT_METHOD_ID = "gap-statement";

export const gapStatementMethod: MethodPlugin<GapStatementPayload> = {
  id: GAP_STATEMENT_METHOD_ID,
  steps: [1],
  tier: "recommended",
  nameKey: "methods.gapStatement.name",
  useWhenKey: "methods.gapStatement.useWhen",
  schema: GapStatementPayloadSchema,
  Editor: GapStatementEditor,
  createEmptyPayload: () => ({ ideal: "", actual: "", gap: "", gapValue: 0, unit: "", baselinePeriod: "" }),
  renderToA3: renderGapStatementToA3,
};
