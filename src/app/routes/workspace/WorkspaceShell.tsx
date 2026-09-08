import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { AssistantColumn } from "./AssistantColumn";
import { StepOverview } from "./StepOverview";
import { StepPage } from "./StepPage";
import { StepQuickJump } from "./StepQuickJump";
import { isStepEmpty } from "./stepStatus";
import { WorkspaceTopBar } from "./WorkspaceTopBar";

/**
 * W1/D-217/D-218: `StepStepper`'s persistent rail is gone — the center
 * column is either the landing overview (`activeStepId === null`, the
 * default on open) or a step page with its own quick-jump strip above it.
 *
 * W2/D-217: the old, always-present `RightPanel` is gone entirely. Export
 * and the four whole-project tools (Traceability/Review/Audit/Translate)
 * moved to `WorkspaceTopBar`'s `ProjectToolsBar` (always mounted, so they
 * stay reachable on the landing view too); the step-scoped AI chatbox
 * (`AssistantColumn`) only renders alongside an open step page, since it has
 * no meaning without a step to be scoped to. `StepPage` gets `key={activeStepId}`
 * so its own `ActiveEditor` accordion state resets on every step change
 * instead of leaking a stale `entryId`/`plugin` reference across steps.
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
          <>
            <div className="flex flex-1 flex-col overflow-hidden">
              <StepQuickJump
                project={project}
                activeStepId={activeStepId}
                onNavigate={handleNavigate}
                onBackToOverview={() => setActiveStep(null)}
              />
              <StepPage
                key={activeStepId}
                stepId={activeStepId}
                advisory={
                  advisoryStepId === activeStepId
                    ? t("workspace.jumpAdvisory", { step: activeStepId })
                    : null
                }
                onDismissAdvisory={() => setAdvisoryStepId(null)}
              />
            </div>
            {project.meta.ai.enabled && <AssistantColumn stepId={activeStepId} />}
          </>
        )}
      </div>
    </div>
  );
}
