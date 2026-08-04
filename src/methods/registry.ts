import type { ReactNode } from "react";
import type { A3EntryRendererMap, A3ImageKind, A3ImageSize } from "../a3/methodContract";
import type { StepId } from "../domain/model";
import { actionItemMethod } from "./actionItem";
import { categoryBreakdownMethod } from "./categoryBreakdown";
import { causeEffectMatrixMethod } from "./causeEffectMatrix";
import { comparativeAnalysisMethod } from "./comparativeAnalysis";
import { checkSheetMethod } from "./checkSheet";
import { containmentIcaMethod } from "./containmentIca";
import { fishboneMethod } from "./fishbone";
import { fiveG5N1KMethod } from "./fiveG5N1K";
import { fiveW2HMethod } from "./fiveW2H";
import { fiveWhyMethod } from "./fiveWhy";
import { gapStatementMethod } from "./gapStatement";
import { genericTextMethod } from "./genericText";
import { isIsNotMethod } from "./isIsNot";
import { msaGageRrMethod } from "./msaGageRr";
import { paretoMethod } from "./pareto";
import { problemTypeClassifierMethod } from "./problemTypeClassifier";
import { processFlowSipocMethod } from "./processFlowSipoc";
import { smartTargetMethod } from "./smartTarget";
import { stratificationMatrixMethod } from "./stratificationMatrix";
import { threeLeggedFiveWhyMethod } from "./threeLeggedFiveWhy";
import { tpmLossTaxonomyMethod } from "./tpmLossTaxonomy";
import { trendMethod } from "./trend";
import { countermeasureMethod } from "./countermeasure";
import { faultTreeMethod } from "./faultTree";
import { hypothesisVerificationMethod } from "./hypothesisVerification";
import { icaPcaTransitionMethod } from "./icaPcaTransition";
import { pfmeaLinkageMethod } from "./pfmeaLinkage";
import { pointOfCauseMethod } from "./pointOfCause";
import { whyWhyTreeMethod } from "./whyWhyTree";
import { registerMethod, type ErasedMethodPlugin } from "./types";
import { vocComplaintMethod } from "./vocComplaint";

/**
 * D-07: adding a method must never require touching the step page, the
 * preview, or the exporter — this array is the one place a new plugin is
 * registered. Phase 3 shipped exactly one plugin; Phase 5 added SPEC.md §6's
 * wave 1; Phase 6a (D-114) added Steps 1–2's remaining ten; Phase 6b adds the
 * five reference-bearing methods (D-116) plus Step 4's five plain ones.
 */
export const METHOD_REGISTRY: readonly ErasedMethodPlugin[] = [
  registerMethod(genericTextMethod),
  registerMethod(paretoMethod),
  registerMethod(fishboneMethod),
  registerMethod(fiveG5N1KMethod),
  registerMethod(trendMethod),
  registerMethod(isIsNotMethod),
  registerMethod(smartTargetMethod),
  registerMethod(fiveWhyMethod),
  registerMethod(threeLeggedFiveWhyMethod),
  registerMethod(gapStatementMethod),
  registerMethod(fiveW2HMethod),
  registerMethod(problemTypeClassifierMethod),
  registerMethod(tpmLossTaxonomyMethod),
  registerMethod(vocComplaintMethod),
  registerMethod(containmentIcaMethod),
  registerMethod(stratificationMatrixMethod),
  registerMethod(checkSheetMethod),
  registerMethod(processFlowSipocMethod),
  registerMethod(msaGageRrMethod),
  registerMethod(pointOfCauseMethod),
  registerMethod(whyWhyTreeMethod),
  registerMethod(faultTreeMethod),
  registerMethod(causeEffectMatrixMethod),
  registerMethod(pfmeaLinkageMethod),
  registerMethod(hypothesisVerificationMethod),
  registerMethod(comparativeAnalysisMethod),
  registerMethod(countermeasureMethod),
  registerMethod(actionItemMethod),
  registerMethod(icaPcaTransitionMethod),
  registerMethod(categoryBreakdownMethod),
];

export function getMethodsForStep(stepId: StepId): readonly ErasedMethodPlugin[] {
  return METHOD_REGISTRY.filter((plugin) => plugin.steps.includes(stepId));
}

/** Returns `undefined` for a `methodId` this build doesn't recognize — see P-05. */
export function getMethodById(methodId: string): ErasedMethodPlugin | undefined {
  return METHOD_REGISTRY.find((plugin) => plugin.id === methodId);
}

/**
 * The composition-root bridge into `buildA3Layout` (`src/a3`, pure —
 * cannot import this file or anything React-tainted, D-43/D-94). Callers
 * that need the pure `A3EntryRendererMap` build it once from this registry
 * and pass it through `BuildA3LayoutOptions.rendererMap` instead of
 * `buildA3Layout` importing `src/methods` itself.
 */
export function getA3RendererMap(): A3EntryRendererMap {
  return Object.fromEntries(
    METHOD_REGISTRY.map((plugin) => [plugin.id, plugin.renderToA3] as const),
  );
}

/**
 * D-102: the same dependency-injection shape as `getA3RendererMap`, one
 * layer over for images — `src/a3/render/rasterize.ts` (React-permitted,
 * D-94's carve-out) receives this map rather than importing `src/methods`
 * itself, so `src/a3` still never depends on the plugin registry directly.
 */
export function getA3ImageRendererMap(): Readonly<
  Partial<Record<A3ImageKind, (spec: unknown, size: A3ImageSize) => ReactNode>>
> {
  const entries = METHOD_REGISTRY.filter(
    (
      plugin,
    ): plugin is ErasedMethodPlugin & {
      imageKind: A3ImageKind;
      renderImage: (spec: unknown, size: A3ImageSize) => ReactNode;
    } => plugin.imageKind !== undefined && plugin.renderImage !== undefined,
  ).map((plugin) => [plugin.imageKind, plugin.renderImage] as const);

  return Object.fromEntries(entries);
}
