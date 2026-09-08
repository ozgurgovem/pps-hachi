import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { Button } from "../../../ui";
import { AssistantPanel } from "./AssistantPanel";
import { getCoachingMarkdown } from "./coachContent";
import { CoachingBlocks } from "./CoachingBlocks";
import { parseCoachingMarkdown } from "./coachingMarkdown";

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
        <AssistantGuideCard stepId={stepId} />
        <AssistantPanel stepId={stepId} />
      </div>
    </aside>
  );
}

/**
 * D-218's "otomatik giriş rehberi" — shown the moment the column mounts, no
 * button, no model call. Reuses `CoachBand`'s exact own content
 * (`getCoachingMarkdown`/`parseCoachingMarkdown`/`CoachingBlocks`) rather
 * than a hand-picked excerpt — D-218's own rule is "derived from existing
 * coaching content, never independently AI-generated," and the full,
 * already-written file satisfies that without a second, fragile
 * section-picking heuristic.
 */
function AssistantGuideCard({ stepId }: { stepId: StepId }) {
  const { t, i18n } = useTranslation();
  const language = i18n.language === "tr" ? "tr" : "en";
  const blocks = parseCoachingMarkdown(getCoachingMarkdown(language, stepId));

  return (
    <div className="flex flex-col gap-2 rounded-control border border-dashed border-border bg-surface p-3">
      <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
        {t("workspace.assistant.guideEyebrow")}
      </span>
      <CoachingBlocks blocks={blocks} />
    </div>
  );
}
