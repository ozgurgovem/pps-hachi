import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import type { ActiveEditor } from "./activeEditor";
import { A3PreviewReservedBand } from "./A3PreviewReservedBand";
import { CoachBand } from "./CoachBand";
import { EntriesBand } from "./EntriesBand";
import { MethodBand } from "./MethodBand";
import { ReadinessAdvisory } from "./ReadinessAdvisory";
import { RoundsBand } from "./RoundsBand";
import { SignOffPanel } from "./SignOffPanel";
import type { DescriptorResult } from "./useA3PreviewSync";

interface StepPageProps {
  stepId: StepId;
  advisory: string | null;
  onDismissAdvisory: () => void;
  /** W3: built once in `WorkspaceShell`, threaded down to `A3PreviewReservedBand` — see its own doc comment. */
  descriptorResult: DescriptorResult;
}

/**
 * W2/D-217 §2.1: owns the single `ActiveEditor` slot the accordion layout
 * needs (create in `MethodBand` XOR edit in `EntriesBand`, never both) —
 * `WorkspaceShell` remounts this component on every step change
 * (`key={stepId}`), which resets this state for free instead of needing an
 * explicit effect to clear a stale `entryId`/`plugin` reference.
 */
export function StepPage({ stepId, advisory, onDismissAdvisory, descriptorResult }: StepPageProps) {
  const { t, i18n } = useTranslation();
  const [activeEditor, setActiveEditor] = useState<ActiveEditor | null>(null);
  const stepLabel = t("workspace.stepNumberLabel", { step: stepId });
  const stepName = t(`workspace.steps.${stepId}.name`);
  // W1/D-218 §2.6: `i18n.language`, not `project.meta.language` — this is
  // interface chrome (`workspace.steps.{N}.name` is already read via the
  // active UI language), a separate concept from the exported A3's own
  // content language (D-188). `.toLocaleUpperCase("tr")` rather than plain
  // `.toUpperCase()`, which upper-cases Turkish "i" the English way
  // ("ANALIZI", missing the dot) instead of "İ" — CLAUDE.md's own Turkish-
  // character warning, hit directly here.
  const title = `${stepLabel}. ${stepName}`.toLocaleUpperCase(i18n.language === "tr" ? "tr" : undefined);

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

      <h1 className="font-display text-2xl font-semibold text-ink">{title}</h1>
      <ReadinessAdvisory stepId={stepId} />

      <CoachBand stepId={stepId} />
      <MethodBand
        stepId={stepId}
        activeEditor={activeEditor}
        onStartCreate={(plugin) => setActiveEditor({ kind: "create", plugin })}
        onCloseEditor={() => setActiveEditor(null)}
      />
      <EntriesBand
        stepId={stepId}
        activeEditor={activeEditor}
        onStartEdit={(entryId) => setActiveEditor({ kind: "edit", entryId })}
        onCloseEditor={() => setActiveEditor(null)}
      />
      {stepId === 7 && <RoundsBand />}
      {stepId === 8 && <SignOffPanel />}
      <A3PreviewReservedBand stepId={stepId} descriptorResult={descriptorResult} />
    </main>
  );
}
