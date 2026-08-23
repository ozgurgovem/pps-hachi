import { useTranslation } from "react-i18next";
import { STEP_IDS, type ProjectModel, type StepId } from "../../../domain/model";
import { evaluateReadiness } from "../../../domain/readiness";
import { Badge, cn } from "../../../ui";
import { getStepStatus, type StepStatus } from "./stepStatus";

interface StepStepperProps {
  project: ProjectModel;
  activeStepId: StepId;
  onNavigate: (stepId: StepId) => void;
}

/** Badge's variant keys are kebab-case for "in progress"; `StepStatus` is camelCase — everything else matches 1:1. */
function badgeVariant(status: StepStatus): "empty" | "in-progress" | "complete" | "flagged" {
  return status === "inProgress" ? "in-progress" : status;
}

/** SPEC.md §2.2's left rail: number, name, completion state, entry count. Click jumps — navigation is never linear-locked. */
export function StepStepper({ project, activeStepId, onNavigate }: StepStepperProps) {
  const { t } = useTranslation();
  const readiness = evaluateReadiness(project);

  return (
    <nav
      aria-label={t("workspace.stepNavLabel")}
      className="flex w-60 shrink-0 flex-col gap-1 overflow-y-auto border-r border-border bg-surface-raised p-3"
    >
      {STEP_IDS.map((stepId) => {
        const step = project.steps[stepId];
        const status = getStepStatus(step, readiness[stepId]);
        const isActive = stepId === activeStepId;
        const stepName = t(`workspace.steps.${stepId}.name`);
        return (
          <button
            key={stepId}
            type="button"
            onClick={() => onNavigate(stepId)}
            aria-current={isActive ? "step" : undefined}
            aria-label={t("workspace.stepAriaLabel", { step: stepId, name: stepName })}
            className={cn(
              "flex flex-col gap-1 rounded-control border px-3 py-2 text-left transition-colors",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
              isActive ? "border-accent bg-surface" : "border-transparent hover:bg-surface",
            )}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-2xs text-ink-muted">{String(stepId).padStart(2, "0")}</span>
              <Badge status={badgeVariant(status)}>{t(`workspace.stepStatus.${status}`)}</Badge>
            </div>
            <span className="font-body text-sm text-ink">{stepName}</span>
            <span className="font-mono text-2xs text-ink-muted">
              {t("workspace.entriesBand.entryCount", { count: step.entries.length })}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
