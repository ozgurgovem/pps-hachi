import type { ReactNode } from "react";
import type { A3EntryRendererMap, A3ImageKind, A3ImageSize } from "../a3/methodContract";
import type { StepId } from "../domain/model";
import { actionItemMethod } from "./actionItem";
import { categoryBreakdownMethod } from "./categoryBreakdown";
import { causeEffectMatrixMethod } from "./causeEffectMatrix";
import { comparativeAnalysisMethod } from "./comparativeAnalysis";
import { checkSheetMethod } from "./checkSheet";
import { containmentIcaMethod } from "./containmentIca";
import { costApprovalMethod } from "./costApproval";
import { distributionChartMethod } from "./distributionChart";
import { documentUpdatesTrackerMethod } from "./documentUpdatesTracker";
import { errorProofingHierarchyMethod } from "./errorProofingHierarchy";
import { fishboneMethod } from "./fishbone";
import { fiveG5N1KMethod } from "./fiveG5N1K";
import { fiveN1KMethod } from "./fiveN1K";
import { fiveW2HMethod } from "./fiveW2H";
import { fiveWhyMethod } from "./fiveWhy";
import { gapStatementMethod } from "./gapStatement";
import { genericTextMethod } from "./genericText";
import { implementationIssuesLogMethod } from "./implementationIssuesLog";
import { isIsNotMethod } from "./isIsNot";
import { lessonsLearnedMethod } from "./lessonsLearned";
import { msaGageRrMethod } from "./msaGageRr";
import { paretoMethod } from "./pareto";
import { problemImpactMethod } from "./problemImpact";
import { problemTypeClassifierMethod } from "./problemTypeClassifier";
import { processFlowSipocMethod } from "./processFlowSipoc";
import { smartTargetMethod } from "./smartTarget";
import { sustainmentAuditMethod } from "./sustainmentAudit";
import { stratificationMatrixMethod } from "./stratificationMatrix";
import { threeLeggedFiveWhyMethod } from "./threeLeggedFiveWhy";
import { tpmLossTaxonomyMethod } from "./tpmLossTaxonomy";
import { trainingCommunicationRecordMethod } from "./trainingCommunicationRecord";
import { trendMethod } from "./trend";
import { trialPlanMethod } from "./trialPlan";
import { trialResultLogMethod } from "./trialResultLog";
import { countermeasureMethod } from "./countermeasure";
import { faultTreeMethod } from "./faultTree";
import { hypothesisVerificationMethod } from "./hypothesisVerification";
import { icaPcaTransitionMethod } from "./icaPcaTransition";
import { impactEffortMatrixMethod } from "./impactEffortMatrix";
import { kpiStripMethod } from "./kpiStrip";
import { pfmeaLinkageMethod } from "./pfmeaLinkage";
import { pointOfCauseMethod } from "./pointOfCause";
import { sideEffectRiskAssessmentMethod } from "./sideEffectRiskAssessment";
import { weightedDecisionMatrixMethod } from "./weightedDecisionMatrix";
import { whyWhyTreeMethod } from "./whyWhyTree";
import { yokotenTrackerMethod } from "./yokotenTracker";
import { registerMethod, type ErasedMethodPlugin } from "./types";
import { vocComplaintMethod } from "./vocComplaint";

/**
 * D-07: adding a method must never require touching the step page, the
 * preview, or the exporter — this array is the one place a new plugin is
 * registered. Phase 3 shipped exactly one plugin; Phase 5 added SPEC.md §6's
 * wave 1; Phase 6a (D-114) added Steps 1–2's remaining ten; Phase 6b adds the
 * five reference-bearing methods (D-116) plus Step 4's five plain ones;
 * Phase 6c adds Step 2's distribution chart (the one new mechanism this
 * slice introduces) plus Steps 5–6's remaining plain methods — the action
 * plan Gantt is deliberately not among them, see P-22/D-114. Oturum C2 adds
 * Step 1's `five-n1k` strip and `problem-impact` panel (D-163/D-166), zero
 * new mechanisms. Oturum C3 adds Step 7's `kpi-strip` — its one new
 * mechanism this slice introduces (D-167/D-177/P-36). Oturum C4 adds Step
 * 7's `sustainment-audit` and Step 8's `document-updates-tracker`/
 * `yokoten-tracker`/`lessons-learned` — B1's §13.4 remaining four
 * candidates, zero new mechanisms, none carrying a reference role.
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
  registerMethod(distributionChartMethod),
  registerMethod(errorProofingHierarchyMethod),
  registerMethod(impactEffortMatrixMethod),
  registerMethod(weightedDecisionMatrixMethod),
  registerMethod(sideEffectRiskAssessmentMethod),
  registerMethod(trialPlanMethod),
  registerMethod(costApprovalMethod),
  registerMethod(trialResultLogMethod),
  registerMethod(trainingCommunicationRecordMethod),
  registerMethod(implementationIssuesLogMethod),
  registerMethod(fiveN1KMethod),
  registerMethod(problemImpactMethod),
  registerMethod(kpiStripMethod),
  registerMethod(sustainmentAuditMethod),
  registerMethod(documentUpdatesTrackerMethod),
  registerMethod(yokotenTrackerMethod),
  registerMethod(lessonsLearnedMethod),
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
