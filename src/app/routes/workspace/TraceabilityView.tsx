import { useTranslation } from "react-i18next";
import { STEP_IDS, type StepId } from "../../../domain/model";
import { evaluateReadiness } from "../../../domain/readiness";
import { findOrphanedReferences } from "../../../domain/selectors";
import { useProjectStore } from "../../../state";
import { Badge } from "../../../ui";
import { buildTraceabilityChains, type TraceabilityNode } from "./traceability";

interface ChainNodeProps {
  readonly node: TraceabilityNode;
  readonly flaggedSteps: ReadonlySet<StepId>;
  readonly onJump: (stepId: StepId) => void;
}

function ChainNode({ node, flaggedSteps, onJump }: ChainNodeProps) {
  const { t } = useTranslation();
  const label = t("workspace.traceability.nodeLabel", { step: node.stepId, title: node.entryTitle });

  return (
    <li>
      <button
        type="button"
        onClick={() => onJump(node.stepId)}
        aria-label={t("workspace.traceability.jumpAriaLabel", { step: node.stepId, title: node.entryTitle })}
        className="flex items-center gap-2 rounded-control px-1 py-0.5 text-left font-body text-sm text-ink transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
      >
        <span>{label}</span>
        {flaggedSteps.has(node.stepId) && <Badge status="flagged">{t("workspace.stepStatus.flagged")}</Badge>}
      </button>
      {node.children.length > 0 && (
        <ul className="ml-3 mt-1 flex flex-col gap-1 border-l border-border pl-3">
          {node.children.map((child) => (
            <ChainNode key={`${child.entryId}-${child.role ?? "root"}`} node={child} flaggedSteps={flaggedSteps} onJump={onJump} />
          ))}
        </ul>
      )}
    </li>
  );
}

/**
 * G2: originally `RightPanel`'s third tab, now opened as a dialog from
 * `ProjectToolsBar` (W2/D-217) — unchanged itself, only its container moved.
 * `buildTraceabilityChains` is this session's
 * only new mechanism (§4's own budget) — everything else here reads
 * already-shipped selectors: `findOrphanedReferences` (D-117) for the
 * "warns on orphans" half of `SPEC.md` §4.2, `evaluateReadiness` (D-196) for
 * the per-node flagged badge. Reuses `ReadinessAdvisory`'s own
 * `border-danger`/`text-danger` visual language for the orphan block rather
 * than inventing a new one.
 */
export function TraceabilityView() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const setActiveStep = useProjectStore((s) => s.setActiveStep);

  if (!project) {
    return null;
  }

  const chains = buildTraceabilityChains(project);
  const orphans = findOrphanedReferences(project);
  const readiness = evaluateReadiness(project);
  const flaggedSteps = new Set<StepId>(STEP_IDS.filter((stepId) => readiness[stepId].status === "flagged"));

  return (
    <div className="flex flex-col gap-4">
      {orphans.length > 0 && (
        <div
          role="alert"
          className="flex flex-col gap-1 rounded-control border border-danger bg-surface-raised p-3 font-body text-sm text-danger"
        >
          <p className="font-medium">{t("workspace.traceability.orphansTitle")}</p>
          <ul className="flex flex-col gap-1">
            {orphans.map((orphan, index) => (
              <li key={`${orphan.entryId}-${orphan.reference.targetEntryId}-${index}`}>
                {t("workspace.traceability.orphanLine", {
                  step: orphan.stepId,
                  title: orphan.entryTitle,
                  role: orphan.reference.role,
                })}
              </li>
            ))}
          </ul>
        </div>
      )}

      {chains.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">{t("workspace.traceability.empty")}</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {chains.map((root) => (
            <ChainNode key={root.entryId} node={root} flaggedSteps={flaggedSteps} onJump={setActiveStep} />
          ))}
        </ul>
      )}

      <p className="font-body text-xs text-ink-muted">{t("workspace.traceability.standardGapNote")}</p>
    </div>
  );
}
