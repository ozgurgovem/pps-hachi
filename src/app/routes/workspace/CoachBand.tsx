import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { Button } from "../../../ui";
import { getCoachingMarkdown } from "./coachContent";
import { parseCoachingMarkdown } from "./coachingMarkdown";

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
          {blocks.map((block, index) => {
            if (block.type === "heading") {
              return (
                <h3
                  key={index}
                  className="font-display text-xs font-semibold uppercase tracking-wide text-ink"
                >
                  {block.text}
                </h3>
              );
            }
            if (block.type === "list") {
              return (
                <ul key={index} className="list-disc pl-5 font-body text-sm text-ink-muted">
                  {block.items.map((item, itemIndex) => (
                    <li key={itemIndex}>{item}</li>
                  ))}
                </ul>
              );
            }
            return (
              <p key={index} className="font-body text-sm text-ink-muted">
                {block.text}
              </p>
            );
          })}
        </div>
      )}
    </section>
  );
}
