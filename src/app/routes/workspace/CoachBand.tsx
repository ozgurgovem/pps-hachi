import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { Button } from "../../../ui";
import { getCoachingMarkdown } from "./coachContent";
import { parseCoachingMarkdown } from "./coachingMarkdown";
import { CoachingBlocks } from "./CoachingBlocks";

interface CoachBandProps {
  stepId: StepId;
}

function storageKey(stepId: StepId): string {
  return `pps-hachi.coachBand.step-${stepId}`;
}

/** Collapse state remembers per step (SPEC.md §2.2) — a UI preference, not project content, so it lives in localStorage rather than `ProjectModel`. */
export function CoachBand({ stepId }: CoachBandProps) {
  const { t, i18n } = useTranslation();
  const language = i18n.language === "tr" ? "tr" : "en";
  const [isOpen, setIsOpen] = useState(() => window.localStorage.getItem(storageKey(stepId)) !== "collapsed");

  function toggle() {
    const next = !isOpen;
    setIsOpen(next);
    window.localStorage.setItem(storageKey(stepId), next ? "expanded" : "collapsed");
  }

  const blocks = parseCoachingMarkdown(getCoachingMarkdown(language, stepId));

  return (
    <section className="rounded-control border border-border bg-surface-raised p-4">
      <Button variant="ghost" size="sm" onClick={toggle} aria-expanded={isOpen}>
        {isOpen ? t("workspace.coachBand.hide") : t("workspace.coachBand.show")}
      </Button>
      {isOpen && (
        <div className="mt-3 flex flex-col gap-3">
          <CoachingBlocks blocks={blocks} />
        </div>
      )}
    </section>
  );
}
