import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { normalizedEditDistance } from "../../../ai/editDistance";
import { getWholeProjectPromptFile } from "../../../ai/prompts/wholeProjectLibrary";
import { resolveRedactionPolicy } from "../../../ai/redaction";
import { buildSetA3VisibilityCommand, buildUpdateEntryCommand } from "../../../domain/commands";
import type { Provenance } from "../../../domain/model";
import { getA3RendererMap } from "../../../methods/registry";
import { useProjectStore } from "../../../state";
import { Button, Checkbox } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";
import {
  buildEntryLookup,
  buildLayoutReviewContext,
  lookupCondensableText,
  proposeLayoutReviewDiff,
  type EntryLookupEntry,
  type LayoutReviewDiff,
} from "./layoutReview";

const LAYOUT_REVIEW_PROMPT_VERSION = "v1";

interface LayoutReviewPanelProps {
  /** Reused, never rebuilt — `ProjectToolsBar`'s own `useA3PreviewSync` already built this (§1 point 5's own instruction: derive from what `buildA3Layout` already produces). */
  readonly descriptor: A3LayoutDescriptor;
}

type Phase =
  | { readonly phase: "idle" }
  | { readonly phase: "loading" }
  | {
      readonly phase: "review";
      readonly diff: LayoutReviewDiff;
      readonly notices: readonly string[];
      readonly selectedVisibility: ReadonlySet<number>;
      readonly selectedCondensation: ReadonlySet<number>;
    }
  | { readonly phase: "failed"; readonly rawText: string }
  | { readonly phase: "error"; readonly message: string }
  | { readonly phase: "applied"; readonly visibilityCount: number; readonly condensationCount: number };

function entryLabel(lookup: ReadonlyMap<string, EntryLookupEntry>, entryId: string): string {
  return lookup.get(entryId)?.entry.title || entryId;
}

/**
 * Faz 10/K1: the "Review" tab's own content — §8.10's A3 placement
 * optimizer + cell-budget condensation, as a diff previewed side by side and
 * applied only on Accept (D-15 LOCKED, unconditionally: every write below
 * goes through the same `buildSetA3VisibilityCommand`/`buildUpdateEntryCommand`
 * a manual edit already uses, nothing new was invented — §2.7's own
 * done-criterion). §2.5's own decision: granular, a checkbox per line
 * (defaulting checked) plus one "Apply selected" button, rather than a
 * single all-or-nothing accept — SPEC's own "previewed side by side" reads
 * as a list, not one big gate.
 */
export function LayoutReviewPanel({ descriptor }: LayoutReviewPanelProps) {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const dispatch = useProjectStore((s) => s.dispatch);
  const [state, setState] = useState<Phase>({ phase: "idle" });

  if (!project) {
    return null;
  }

  const modelId = project.meta.ai.modelId;
  const lookup = buildEntryLookup(project);

  async function handleAnalyze() {
    if (!project || !modelId) {
      return;
    }
    const promptFile = getWholeProjectPromptFile("layout-review", LAYOUT_REVIEW_PROMPT_VERSION);
    if (!promptFile) {
      setState({ phase: "error", message: t("workspace.layoutReview.missingPromptFile") });
      return;
    }
    setState({ phase: "loading" });
    try {
      const { contextText, droppedNotes } = buildLayoutReviewContext(project, descriptor, getA3RendererMap());
      const result = await proposeLayoutReviewDiff({
        promptBody: promptFile.body,
        contextText,
        modelId,
        redaction: resolveRedactionPolicy(project.meta.ai.redaction),
        lookup,
        projectId: project.id,
        promptVersion: `layout-review.${LAYOUT_REVIEW_PROMPT_VERSION}`,
      });
      if (result.outcome === "failed") {
        setState({ phase: "failed", rawText: result.rawText });
        return;
      }
      setState({
        phase: "review",
        diff: result.diff,
        notices: [...droppedNotes, ...result.droppedNotes],
        selectedVisibility: new Set(result.diff.visibilityChanges.map((_, index) => index)),
        selectedCondensation: new Set(result.diff.textCondensations.map((_, index) => index)),
      });
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error) });
    }
  }

  function toggleVisibility(index: number) {
    if (state.phase !== "review") {
      return;
    }
    const next = new Set(state.selectedVisibility);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setState({ ...state, selectedVisibility: next });
  }

  function toggleCondensation(index: number) {
    if (state.phase !== "review") {
      return;
    }
    const next = new Set(state.selectedCondensation);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setState({ ...state, selectedCondensation: next });
  }

  function handleApply() {
    if (state.phase !== "review" || !project || !modelId) {
      return;
    }
    // Rebuilt fresh rather than reusing the outer `lookup` — the diff may be
    // reviewed for a while before Apply, and a stale lookup could silently
    // write against an entry that has since changed or been removed.
    const liveLookup = buildEntryLookup(project);
    const acceptedBy = project.meta.owner.name;
    let visibilityCount = 0;
    let condensationCount = 0;

    state.diff.visibilityChanges.forEach((change, index) => {
      if (!state.selectedVisibility.has(index)) {
        return;
      }
      const found = liveLookup.get(change.entryId);
      if (!found) {
        return;
      }
      dispatch(buildSetA3VisibilityCommand(found.step, found.stepId, change.entryId, change.newVisibility));
      visibilityCount += 1;
    });

    state.diff.textCondensations.forEach((line, index) => {
      if (!state.selectedCondensation.has(index)) {
        return;
      }
      const found = liveLookup.get(line.entryId);
      if (!found) {
        return;
      }
      const originalText = lookupCondensableText(liveLookup, line.entryId, line.field);
      if (originalText === undefined) {
        return;
      }
      const now = new Date().toISOString();
      const provenance: Provenance = {
        origin: "ai-accepted",
        model: { providerId: "vorion", modelId, promptVersion: `layout-review.${LAYOUT_REVIEW_PROMPT_VERSION}` },
        generatedAt: now,
        acceptedBy,
        acceptedAt: now,
        editDistance: normalizedEditDistance(originalText, line.condensedText),
      };
      const { entry, step, stepId } = found;
      if (line.field === "title") {
        dispatch(
          buildUpdateEntryCommand(step, stepId, entry.id, {
            title: line.condensedText,
            payload: entry.payload,
            now,
            provenance,
          }),
        );
        condensationCount += 1;
        return;
      }
      const payload = entry.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return;
      }
      const nextPayload = { ...(payload as Record<string, unknown>), [line.field]: line.condensedText };
      dispatch(
        buildUpdateEntryCommand(step, stepId, entry.id, { title: entry.title, payload: nextPayload, now, provenance }),
      );
      condensationCount += 1;
    });

    setState({ phase: "applied", visibilityCount, condensationCount });
  }

  function handleReject() {
    setState({ phase: "idle" });
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
      <p className="font-body text-sm text-ink-muted">{t("workspace.layoutReview.intro")}</p>

      {(state.phase === "idle" || state.phase === "error") && (
        <div className="flex flex-col gap-2">
          {state.phase === "error" && (
            <p role="alert" className="font-body text-sm text-danger">
              {state.message}
            </p>
          )}
          <Button type="button" onClick={() => void handleAnalyze()}>
            {t("workspace.layoutReview.analyze")}
          </Button>
        </div>
      )}

      {state.phase === "loading" && (
        <p className="font-body text-sm text-ink-muted">{t("workspace.layoutReview.analyzing")}</p>
      )}

      {state.phase === "failed" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {t("workspace.layoutReview.failed")}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface p-2 font-mono text-2xs text-ink-muted">
            {state.rawText}
          </pre>
          <Button type="button" variant="ghost" onClick={handleReject}>
            {t("workspace.layoutReview.retry")}
          </Button>
        </div>
      )}

      {state.phase === "applied" && (
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-ink">
            {t("workspace.layoutReview.appliedSummary", {
              visibilityCount: state.visibilityCount,
              condensationCount: state.condensationCount,
            })}
          </p>
          <Button type="button" variant="ghost" onClick={() => setState({ phase: "idle" })}>
            {t("workspace.layoutReview.analyzeAgain")}
          </Button>
        </div>
      )}

      {state.phase === "review" && (
        <div className="flex flex-col gap-4">
          {state.notices.length > 0 && (
            <div className="flex flex-col gap-1 rounded-control border border-border bg-surface p-2">
              {state.notices.map((note) => (
                <p key={note} role="status" className="font-body text-2xs text-ink-muted">
                  {note}
                </p>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-2">
            <p className="font-display text-sm font-semibold">{t("workspace.layoutReview.visibilityChangesTitle")}</p>
            {state.diff.visibilityChanges.length === 0 && (
              <p className="font-body text-sm text-ink-muted">{t("workspace.layoutReview.noneProposed")}</p>
            )}
            {state.diff.visibilityChanges.map((change, index) => (
              <label
                key={`${change.entryId}-${index}`}
                className="flex items-start gap-2 rounded-control border border-border bg-surface p-2"
              >
                <Checkbox
                  checked={state.selectedVisibility.has(index)}
                  onCheckedChange={() => toggleVisibility(index)}
                />
                <span className="flex flex-col gap-0.5">
                  <span className="font-body text-sm text-ink">
                    {t("workspace.layoutReview.visibilityChangeLine", {
                      title: entryLabel(lookup, change.entryId),
                      visibility: t(`workspace.entriesBand.a3Visibility.${change.newVisibility}`),
                    })}
                  </span>
                  <span className="font-body text-xs text-ink-muted">{change.reason}</span>
                </span>
              </label>
            ))}
          </div>

          <div className="flex flex-col gap-2">
            <p className="font-display text-sm font-semibold">{t("workspace.layoutReview.textCondensationsTitle")}</p>
            {state.diff.textCondensations.length === 0 && (
              <p className="font-body text-sm text-ink-muted">{t("workspace.layoutReview.noneProposed")}</p>
            )}
            {state.diff.textCondensations.map((line, index) => {
              const originalText = lookupCondensableText(lookup, line.entryId, line.field);
              return (
                <label
                  key={`${line.entryId}-${line.field}-${index}`}
                  className="flex items-start gap-2 rounded-control border border-border bg-surface p-2"
                >
                  <Checkbox
                    checked={state.selectedCondensation.has(index)}
                    onCheckedChange={() => toggleCondensation(index)}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
                      {entryLabel(lookup, line.entryId)} · {line.field}
                    </span>
                    {originalText !== undefined && (
                      <span className="font-body text-xs text-ink-muted line-through">{originalText}</span>
                    )}
                    <span className="font-body text-sm text-ink">{line.condensedText}</span>
                    <span className="font-body text-xs text-ink-muted">{line.reason}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleApply}
              disabled={state.selectedVisibility.size === 0 && state.selectedCondensation.size === 0}
            >
              {t("workspace.layoutReview.applySelected")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReject}>
              {t("workspace.layoutReview.rejectAll")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
