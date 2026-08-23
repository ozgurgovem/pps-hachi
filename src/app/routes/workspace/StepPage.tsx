import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { CoachBand } from "./CoachBand";
import { EntriesBand } from "./EntriesBand";
import { MethodBand } from "./MethodBand";
import { ReadinessAdvisory } from "./ReadinessAdvisory";
import { RoundsBand } from "./RoundsBand";
import { SignOffPanel } from "./SignOffPanel";

interface StepPageProps {
  stepId: StepId;
  advisory: string | null;
  onDismissAdvisory: () => void;
}

/** SPEC.md §2.2: every step page has the same three bands, in the same order. */
export function StepPage({ stepId, advisory, onDismissAdvisory }: StepPageProps) {
  const { t } = useTranslation();

  return (
    <main className="flex flex-1 flex-col gap-4 overflow-y-auto p-6">
      {advisory && (
        <p
          role="status"
          className="flex items-center justify-between gap-3 rounded-control border border-accent bg-surface-raised p-3 font-body text-sm text-ink"
        >
          <span>{advisory}</span>
          <button
            type="button"
            onClick={onDismissAdvisory}
            aria-label="Dismiss"
            className="font-mono text-xs text-ink-muted hover:text-ink"
          >
            ×
          </button>
        </p>
      )}

      <h1 className="font-display text-2xl font-semibold text-ink">
        {stepId}. {t(`workspace.steps.${stepId}.name`)}
      </h1>
      <ReadinessAdvisory stepId={stepId} />

      <CoachBand stepId={stepId} />
      <MethodBand stepId={stepId} />
      <EntriesBand stepId={stepId} />
      {stepId === 7 && <RoundsBand />}
      {stepId === 8 && <SignOffPanel />}
    </main>
  );
}
