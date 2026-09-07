import { useTranslation } from "react-i18next";
import { STEP_IDS, type ProjectModel, type StepId } from "../../../domain/model";
import { evaluateReadiness } from "../../../domain/readiness";
import { cn } from "../../../ui";
import { getStepStatus, type StepStatus } from "./stepStatus";

interface StepQuickJumpProps {
  project: ProjectModel;
  activeStepId: StepId;
  onNavigate: (stepId: StepId) => void;
  onBackToOverview: () => void;
}

/**
 * W1/D-218 §2.5: maps `StepStatus` onto D-41's shape vocabulary by hand —
 * deliberately NOT `src/methods/shared/statusGlyph.ts`, whose
 * positive/caution/negative tones are `A3TextTone` (the exported sheet's own
 * vocabulary). The two enums look similar but mean different things; this is
 * this component's own small, local mapping rather than a forced merge of
 * two semantically distinct vocabularies.
 */
const QUICK_JUMP_GLYPHS: Readonly<Record<StepStatus, string>> = {
  complete: "■",
  flagged: "▲",
  inProgress: "●",
  empty: "●",
};

/**
 * W1/D-217/D-218: the rail's one surviving function (jump to any other step
 * without leaving a step page) — rendered above `StepPage`, in the same
 * flex-column container, only while a step is active. Never visible at the
 * same time as `StepOverview`.
 */
export function StepQuickJump({ project, activeStepId, onNavigate, onBackToOverview }: StepQuickJumpProps) {
  const { t } = useTranslation();
  const readiness = evaluateReadiness(project);

  return (
    <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-border bg-surface-raised px-4 py-2">
      <button
        type="button"
        onClick={onBackToOverview}
        aria-label={t("workspace.quickJump.backToOverviewAriaLabel")}
        className="rounded-control border border-fp-gray-light px-3 py-1.5 font-body text-sm text-fp-charcoal transition-colors hover:border-fp-teal hover:text-fp-teal-deep focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal"
      >
        {t("workspace.quickJump.backToOverview")}
      </button>
      <div className="mx-1 h-5 w-px bg-border" aria-hidden="true" />
      <div className="flex flex-wrap gap-1">
        {STEP_IDS.map((stepId) => {
          const status = getStepStatus(project.steps[stepId], readiness[stepId]);
          const stepName = t(`workspace.steps.${stepId}.name`);
          const stepLabel = t("workspace.stepNumberLabel", { step: stepId });
          const isActive = stepId === activeStepId;
          return (
            <button
              key={stepId}
              type="button"
              onClick={() => onNavigate(stepId)}
              aria-label={t("workspace.stepAriaLabel", { step: stepId, name: stepName })}
              aria-current={isActive ? "step" : undefined}
              className={cn(
                "flex items-center gap-1.5 rounded-control border px-2.5 py-1.5 font-mono text-xs transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal",
                isActive
                  ? "border-fp-teal bg-fp-teal text-white"
                  : "border-border text-ink-muted hover:border-fp-teal hover:text-fp-teal-deep",
              )}
            >
              <span aria-hidden="true">{QUICK_JUMP_GLYPHS[status]}</span>
              <span>{stepLabel}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
