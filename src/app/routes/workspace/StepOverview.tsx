import { useTranslation } from "react-i18next";
import { STEP_IDS, type ProjectModel, type StepId } from "../../../domain/model";
import { evaluateReadiness } from "../../../domain/readiness";
import { Badge, Button, cn } from "../../../ui";
import { openOrFocusA3PreviewWindow } from "../a3PreviewWindow/window";
import { getStepStatus, type StepStatus } from "./stepStatus";

interface StepOverviewProps {
  project: ProjectModel;
  onNavigate: (stepId: StepId) => void;
}

/** Badge's variant keys are kebab-case for "in progress"; `StepStatus` is camelCase — everything else matches 1:1. */
function badgeVariant(status: StepStatus): "empty" | "in-progress" | "complete" | "flagged" {
  return status === "inProgress" ? "in-progress" : status;
}

/**
 * W1/D-217/D-218: the landing view that replaces `StepStepper`'s persistent
 * rail — eight cards, one per step, carrying exactly the information the
 * rail used to (status, entry count) plus the two new pieces of coaching
 * copy the mockup added (`cardPurpose`/`cardHowTo`). Clicking a card is the
 * same `onNavigate` `WorkspaceShell.handleNavigate` already used for the
 * rail — the "reassurance, not a warning" advisory for an empty step is
 * unchanged.
 */
export function StepOverview({ project, onNavigate }: StepOverviewProps) {
  const { t } = useTranslation();
  const readiness = evaluateReadiness(project);

  const completeCount = STEP_IDS.filter(
    (stepId) => getStepStatus(project.steps[stepId], readiness[stepId]) === "complete",
  ).length;
  const flaggedCount = STEP_IDS.filter(
    (stepId) => getStepStatus(project.steps[stepId], readiness[stepId]) === "flagged",
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 overflow-y-auto bg-surface p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-fp-display text-3xl font-semibold text-fp-charcoal">
            {t("workspace.stepOverview.heading")}
          </h1>
          <p className="font-body text-sm text-fp-gray-dark">
            {t("workspace.stepOverview.summary", { complete: completeCount, flagged: flaggedCount })}
          </p>
        </div>
        <Button variant="secondary" onClick={() => void openOrFocusA3PreviewWindow()}>
          {t("workspace.stepOverview.openA3Preview")}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STEP_IDS.map((stepId) => {
          const step = project.steps[stepId];
          const status = getStepStatus(step, readiness[stepId]);
          const stepName = t(`workspace.steps.${stepId}.name`);
          const stepLabel = t("workspace.stepNumberLabel", { step: stepId });
          return (
            <button
              key={stepId}
              type="button"
              onClick={() => onNavigate(stepId)}
              aria-label={t("workspace.stepAriaLabel", { step: stepId, name: stepName })}
              className={cn(
                "flex flex-col gap-3 rounded-2xl border border-fp-gray-light bg-surface-raised p-5 text-left shadow-sm",
                "transition-colors hover:border-fp-teal hover:shadow-lg",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fp-teal",
              )}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-semibold uppercase tracking-wide text-fp-teal-deep">
                  {stepLabel}
                </span>
                <Badge status={badgeVariant(status)}>{t(`workspace.stepStatus.${status}`)}</Badge>
              </div>
              <h2 className="font-fp-display text-lg font-semibold text-fp-charcoal">{stepName}</h2>
              <p className="font-body text-sm text-fp-gray-dark">{t(`workspace.steps.${stepId}.cardPurpose`)}</p>
              <p className="font-body text-xs text-fp-gray-mid">{t(`workspace.steps.${stepId}.cardHowTo`)}</p>
              <span className="font-mono text-2xs text-fp-gray-mid">
                {t("workspace.entriesBand.entryCount", { count: step.entries.length })}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
