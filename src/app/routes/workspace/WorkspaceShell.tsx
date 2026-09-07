import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { RightPanel } from "./RightPanel";
import { StepOverview } from "./StepOverview";
import { StepPage } from "./StepPage";
import { StepQuickJump } from "./StepQuickJump";
import { isStepEmpty } from "./stepStatus";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

/**
 * W1/D-217/D-218: `StepStepper`'s persistent rail is gone — the center
 * column is either the landing overview (`activeStepId === null`, the
 * default on open) or a step page with its own quick-jump strip above it.
 * `RightPanel` is unaffected either way, per D-217's own "this initiative
 * only touches the center column" boundary.
 */
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
    if (stepId !== activeStepId && isStepEmpty(project.steps[stepId])) {
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
        {activeStepId === null ? (
          <StepOverview project={project} onNavigate={handleNavigate} />
        ) : (
          <div className="flex flex-1 flex-col overflow-hidden">
            <StepQuickJump
              project={project}
              activeStepId={activeStepId}
              onNavigate={handleNavigate}
              onBackToOverview={() => setActiveStep(null)}
            />
            <StepPage
              stepId={activeStepId}
              advisory={
                advisoryStepId === activeStepId
                  ? t("workspace.jumpAdvisory", { step: activeStepId })
                  : null
              }
              onDismissAdvisory={() => setAdvisoryStepId(null)}
            />
          </div>
        )}
        <RightPanel />
      </div>
    </div>
  );
}
