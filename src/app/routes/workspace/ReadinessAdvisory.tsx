import { useTranslation } from "react-i18next";
import type { StepId } from "../../../domain/model";
import { evaluateReadiness } from "../../../domain/readiness";
import { useProjectStore } from "../../../state";

interface ReadinessAdvisoryProps {
  stepId: StepId;
}

/**
 * SPEC.md §1.2: "Failing a rule shows a non-blocking amber advisory in the
 * step header." This is that advisory — a separate concept from
 * `WorkspaceShell`'s jump advisory (`StepPage`'s existing `advisory` prop),
 * which reassures about navigating to an *empty* step. The two never
 * co-occur: `evaluateReadiness` only ever flags a step that has at least one
 * entry (D-196), so no priority rule between them is needed. Reuses the
 * `danger` token Badge's own "flagged" variant already uses — this app has
 * no separate "amber" design token (D-49), and inventing one would be a new
 * visual decision outside G1's one-mechanism budget.
 */
export function ReadinessAdvisory({ stepId }: ReadinessAdvisoryProps) {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);

  if (!project) {
    return null;
  }

  const readiness = evaluateReadiness(project)[stepId];
  if (readiness.status === "ok" || readiness.warnings.length === 0) {
    return null;
  }

  return (
    <div
      role="status"
      className="flex flex-col gap-1 rounded-control border border-danger bg-surface-raised p-3 font-body text-sm text-danger"
    >
      {readiness.warnings.map((warning, index) => (
        <p key={`${warning.rule}-${index}`}>{t(warning.messageKey)}</p>
      ))}
    </div>
  );
}
