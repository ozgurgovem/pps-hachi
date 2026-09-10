import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { Button } from "../../../ui";
import { AssistantPanel } from "./AssistantPanel";

interface AssistantColumnProps {
  stepId: StepId;
}

/**
 * W2/D-217/P-59: the step-scoped AI support surface Barış asked for on the
 * right of the step page — its own column, not a `RightPanel` tab (that
 * panel is gone entirely as of this dilim) and not a band inside the main
 * column (an earlier mockup round tried that; Barış asked for a chatbox on
 * the right instead, see DECISIONS.md). Collapsible, matching the old
 * `RightPanel`'s own collapse affordance so nothing about that interaction
 * pattern is new to relearn.
 *
 * D-242 (Barış's own real-use report): the step's own coaching guide used to
 * render a second time here (`AssistantGuideCard`), byte-identical to what
 * `CoachBand` already shows in the main column — pure duplication eating the
 * narrow 340px column's own limited space with zero new information. Removed;
 * `CoachBand` stays the one place that content renders.
 */
export function AssistantColumn({ stepId }: AssistantColumnProps) {
  const { t } = useTranslation();
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <div className="flex shrink-0 border-l border-border bg-surface-raised p-2">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(false)}
          aria-label={t("workspace.rightPanel.expand")}
        >
          «
        </Button>
      </div>
    );
  }

  return (
    <aside className="flex w-[340px] shrink-0 flex-col border-l border-border bg-surface-raised">
      <div className="flex items-center justify-between gap-2 border-b border-border p-2">
        <span className="font-display text-sm font-semibold text-ink">{t("workspace.assistant.columnTitle")}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(true)}
          aria-label={t("workspace.rightPanel.collapse")}
        >
          »
        </Button>
      </div>
      <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
        <AssistantPanel stepId={stepId} />
      </div>
    </aside>
  );
}
