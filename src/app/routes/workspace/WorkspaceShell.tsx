import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { RightPanel } from "./RightPanel";
import { StepPage } from "./StepPage";
import { StepStepper } from "./StepStepper";
import { getStepStatus } from "./stepStatus";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

/** SPEC.md §2.2's three-region layout: left rail / center / right panel. */
export function WorkspaceShell() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const readOnly = useProjectStore((s) => s.readOnly);
  const activeStepId = useProjectStore((s) => s.activeStepId);
  const setActiveStep = useProjectStore((s) => s.setActiveStep);
  const [advisoryStepId, setAdvisoryStepId] = useState<StepId | null>(null);

  if (!project) {
    return null;
  }

  const handleNavigate = (stepId: StepId) => {
    // SPEC.md §2.2: jumping to a step with no entries yet is always allowed —
    // this is a reassurance, not a warning, so it never blocks the navigation.
    if (stepId !== activeStepId && getStepStatus(project.steps[stepId]) === "empty") {
      setAdvisoryStepId(stepId);
    } else {
      setAdvisoryStepId(null);
    }
    setActiveStep(stepId);
  };

  return (
    <div className="flex h-screen flex-col">
      <WorkspaceTopBar />
      {readOnly && (
        <p
          role="status"
          className="border-b border-danger bg-surface-raised p-2 text-center font-body text-sm text-danger"
        >
          {t("project.placeholder.readOnlyBanner")}
        </p>
      )}
      <div className="flex flex-1 overflow-hidden">
        <StepStepper project={project} activeStepId={activeStepId} onNavigate={handleNavigate} />
        <StepPage
          stepId={activeStepId}
          advisory={
            advisoryStepId === activeStepId
              ? t("workspace.jumpAdvisory", { step: activeStepId })
              : null
          }
          onDismissAdvisory={() => setAdvisoryStepId(null)}
        />
        <RightPanel />
      </div>
    </div>
  );
}
