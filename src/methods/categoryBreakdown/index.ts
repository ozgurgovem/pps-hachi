import type { MethodPlugin } from "../types";
import { CategoryBreakdownEditor } from "./Editor";
import { renderCategoryBreakdownToA3 } from "./renderToA3";
import { CategoryBreakdownPayloadSchema, type CategoryBreakdownPayload } from "./schema";

export const CATEGORY_BREAKDOWN_METHOD_ID = "category-breakdown";

/**
 * Step 2 only — see `columns.ts`. Not Fishbone (Step 4, D-11, unchanged):
 * this sorts observed sub-problems by category, Fishbone hypothesizes
 * causes by category. Same vocabulary, different job.
 */
export const categoryBreakdownMethod: MethodPlugin<CategoryBreakdownPayload> = {
  id: CATEGORY_BREAKDOWN_METHOD_ID,
  steps: [2],
  tier: "recommended",
  nameKey: "methods.categoryBreakdown.name",
  useWhenKey: "methods.categoryBreakdown.useWhen",
  schema: CategoryBreakdownPayloadSchema,
  Editor: CategoryBreakdownEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderCategoryBreakdownToA3,
  aiProposal: { promptVersion: "v1" },
};
