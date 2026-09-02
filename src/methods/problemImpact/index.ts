import type { MethodPlugin } from "../types";
import { emptyFieldFormValues } from "../shared/fieldForm";
import { ProblemImpactEditor } from "./Editor";
import { PROBLEM_IMPACT_FIELDS } from "./fields";
import { renderProblemImpactToA3 } from "./renderToA3";
import { ProblemImpactPayloadSchema, type ProblemImpactPayload } from "./schema";

export const PROBLEM_IMPACT_METHOD_ID = "problem-impact";

/**
 * No `imageKind`/`renderImage` here — `renderToA3` requests the
 * already-registered `pareto-chart` kind directly, and `paretoMethod`
 * (registered in `src/methods/registry.ts`) already supplies the renderer
 * `getA3ImageRendererMap()` needs for it. See `renderToA3.ts`.
 */
export const problemImpactMethod: MethodPlugin<ProblemImpactPayload> = {
  id: PROBLEM_IMPACT_METHOD_ID,
  steps: [1],
  nameKey: "methods.problemImpact.name",
  useWhenKey: "methods.problemImpact.useWhen",
  schema: ProblemImpactPayloadSchema,
  Editor: ProblemImpactEditor,
  createEmptyPayload: () => ({
    unit: "",
    categories: [],
    ...emptyFieldFormValues(PROBLEM_IMPACT_FIELDS),
  }),
  renderToA3: renderProblemImpactToA3,
  aiProposal: { promptVersion: "v1" },
};
