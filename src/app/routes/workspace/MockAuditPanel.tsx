import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { getWholeProjectPromptFile } from "../../../ai/prompts/wholeProjectLibrary";
import { resolveRedactionPolicy } from "../../../ai/redaction";
import { getA3RendererMap } from "../../../methods/registry";
import { useProjectStore } from "../../../state";
import { Button } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";
import { buildMockAuditContext, proposeMockAuditFindings, type MockAuditFinding } from "./mockAudit";

const MOCK_AUDIT_PROMPT_VERSION = "v1";

type Phase =
  | { readonly phase: "idle" }
  | { readonly phase: "loading" }
  | { readonly phase: "results"; readonly findings: readonly MockAuditFinding[]; readonly notices: readonly string[] }
  | { readonly phase: "failed"; readonly rawText: string }
  | { readonly phase: "error"; readonly message: string };

/**
 * Faz 10/K2/§2.1-§2.2: the mock-auditor findings list — originally a
 * permanent 5th `RightPanel` tab, `aiEnabled`-gated exactly like Review;
 * opened as a dialog from `ProjectToolsBar` since W2/D-217, unchanged
 * itself. Structurally different from `LayoutReviewPanel`
 * (K1): a finding is never applied to `ProjectModel` (§2.1 — D-15's "human
 * accepts" rule is trivially satisfied here because there is no write path
 * at all, not because of an Accept gate), so there is no checkbox, no Apply
 * button, and no persisted "dismissed" state (§2.5 — Barış confirmed
 * fresh/stateless, same philosophy as `evaluateReadiness`'s own S1-S8).
 * Clicking a finding jumps to its step, the same `setActiveStep` interaction
 * `TraceabilityView`'s `ChainNode` already established.
 */
export function MockAuditPanel() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const setActiveStep = useProjectStore((s) => s.setActiveStep);
  const [state, setState] = useState<Phase>({ phase: "idle" });

  if (!project) {
    return null;
  }

  const modelId = project.meta.ai.modelId;

  async function handleAnalyze() {
    if (!project || !modelId) {
      return;
    }
    const promptFile = getWholeProjectPromptFile("mock-audit", MOCK_AUDIT_PROMPT_VERSION);
    if (!promptFile) {
      setState({ phase: "error", message: t("workspace.mockAudit.missingPromptFile") });
      return;
    }
    setState({ phase: "loading" });
    try {
      const { contextText, droppedNotes } = buildMockAuditContext(project, getA3RendererMap());
      const result = await proposeMockAuditFindings({
        promptBody: promptFile.body,
        contextText,
        modelId,
        redaction: resolveRedactionPolicy(project.meta.ai.redaction),
        projectId: project.id,
        promptVersion: `mock-audit.${MOCK_AUDIT_PROMPT_VERSION}`,
      });
      if (result.outcome === "failed") {
        setState({ phase: "failed", rawText: result.rawText });
        return;
      }
      setState({ phase: "results", findings: result.findings, notices: droppedNotes });
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error) });
    }
  }

  if (!modelId) {
    return (
      <p className="font-body text-sm text-ink-muted">
        {t("workspace.assistant.noModelConfigured")}{" "}
        <Link to="/settings" className="text-accent hover:underline">
          {t("workspace.assistant.goToSettings")}
        </Link>
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="font-body text-sm text-ink-muted">{t("workspace.mockAudit.intro")}</p>

      {(state.phase === "idle" || state.phase === "error") && (
        <div className="flex flex-col gap-2">
          {state.phase === "error" && (
            <p role="alert" className="font-body text-sm text-danger">
              {state.message}
            </p>
          )}
          <Button type="button" onClick={() => void handleAnalyze()}>
            {t("workspace.mockAudit.analyze")}
          </Button>
        </div>
      )}

      {state.phase === "loading" && <p className="font-body text-sm text-ink-muted">{t("workspace.mockAudit.analyzing")}</p>}

      {state.phase === "failed" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {t("workspace.mockAudit.failed")}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface p-2 font-mono text-2xs text-ink-muted">
            {state.rawText}
          </pre>
          <Button type="button" variant="ghost" onClick={() => setState({ phase: "idle" })}>
            {t("workspace.mockAudit.retry")}
          </Button>
        </div>
      )}

      {state.phase === "results" && (
        <div className="flex flex-col gap-3">
          {state.notices.length > 0 && (
            <div className="flex flex-col gap-1 rounded-control border border-border bg-surface p-2">
              {state.notices.map((note) => (
                <p key={note} role="status" className="font-body text-2xs text-ink-muted">
                  {note}
                </p>
              ))}
            </div>
          )}

          {state.findings.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">{t("workspace.mockAudit.noFindings")}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {state.findings.map((finding, index) => (
                <li key={`${finding.stepId}-${finding.category}-${index}`}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(finding.stepId)}
                    className="flex w-full flex-col gap-1 rounded-control border border-border bg-surface p-2 text-left transition-colors hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                  >
                    <span className="flex items-center gap-2 font-mono text-2xs uppercase tracking-wide text-ink-muted">
                      <span>{t("workspace.mockAudit.stepLabel", { step: finding.stepId })}</span>
                      <span className={finding.severity === "major" ? "text-danger" : "text-ink-muted"}>
                        {t(`workspace.mockAudit.severity.${finding.severity}`)}
                      </span>
                      <span>{finding.category}</span>
                    </span>
                    <span className="font-body text-sm text-ink">{finding.message}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <Button type="button" variant="ghost" onClick={() => void handleAnalyze()}>
            {t("workspace.mockAudit.analyzeAgain")}
          </Button>
        </div>
      )}
    </div>
  );
}
