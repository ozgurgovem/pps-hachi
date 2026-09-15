import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { normalizedEditDistance } from "../../../ai/editDistance";
import { getWholeProjectPromptFile } from "../../../ai/prompts/wholeProjectLibrary";
import { resolveRedactionPolicy } from "../../../ai/redaction";
import { buildSetMetaHeaderCommand, buildUpdateEntryCommand } from "../../../domain/commands";
import type { Provenance } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { Button, Checkbox } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";
import {
  buildEntryLookup,
  lookupCondensableText,
  type EntryLookupEntry,
} from "./layoutReview";
import {
  buildWholeReportTranslationContext,
  otherLanguage,
  proposeMetaHeaderTranslation,
  proposeWholeReportTranslation,
  type MetaHeaderField,
  type MetaHeaderTranslationLine,
  type WholeReportTranslationDiff,
} from "./entryTranslation";

const WHOLE_REPORT_TRANSLATION_PROMPT_VERSION = "v1";
/** P-56 (ai-katmani-temizligi.md §2): the meta-header mini-panel's own prompt version, independent of the report's. */
const META_HEADER_TRANSLATION_PROMPT_VERSION = "v1";

type Phase =
  | { readonly phase: "idle" }
  | { readonly phase: "loading" }
  | {
      readonly phase: "review";
      readonly diff: WholeReportTranslationDiff;
      readonly notices: readonly string[];
      readonly selected: ReadonlySet<number>;
      /** P-56: a small, separate section — title/customer/partName live on `project.meta` directly, never inside an entry's payload, so they can't share the entry-diff's `entryId`-keyed selection. */
      readonly metaHeaderLines: readonly MetaHeaderTranslationLine[];
      readonly metaHeaderSelected: ReadonlySet<MetaHeaderField>;
    }
  | { readonly phase: "failed"; readonly rawText: string }
  | { readonly phase: "error"; readonly message: string }
  | { readonly phase: "applied"; readonly count: number };

function entryLabel(lookup: ReadonlyMap<string, EntryLookupEntry>, entryId: string): string {
  return lookup.get(entryId)?.entry.title || entryId;
}

/**
 * Faz 10/K3/§2.2/§2.4: the whole-report translation mode, self-contained in
 * its own `RightPanel` tab per Barış's own choice (now opened as a dialog
 * from `ProjectToolsBar`, W2/D-217 — the component itself is unchanged) —
 * unlike D-213's own suggested split (a Settings trigger + a shared review
 * surface), this holds both the "Translate whole report" trigger and the
 * resulting diff, matching the Review/Audit surfaces' own self-contained
 * shape exactly. §2.5
 * LOCKED (D-213): accepting a line never touches `project.meta.language` —
 * it only rewrites the entry's own title/payload field, the same way K1's
 * `LayoutReviewPanel` never touches anything beyond the entry it changes.
 */
export function TranslateReportPanel() {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const dispatch = useProjectStore((s) => s.dispatch);
  const [state, setState] = useState<Phase>({ phase: "idle" });

  if (!project) {
    return null;
  }

  const modelId = project.meta.ai.modelId;
  const targetLanguage = otherLanguage(project.meta.language);
  const lookup = buildEntryLookup(project);

  async function handleAnalyze() {
    if (!project || !modelId) {
      return;
    }
    const promptFile = getWholeProjectPromptFile("translate-report", WHOLE_REPORT_TRANSLATION_PROMPT_VERSION);
    if (!promptFile) {
      setState({ phase: "error", message: t("workspace.translateReport.missingPromptFile") });
      return;
    }
    setState({ phase: "loading" });
    try {
      const { contextText, droppedNotes } = buildWholeReportTranslationContext(project, targetLanguage);
      const result = await proposeWholeReportTranslation({
        promptBody: promptFile.body,
        contextText,
        modelId,
        redaction: resolveRedactionPolicy(project.meta.ai.redaction),
        lookup,
        projectId: project.id,
        promptVersion: `translate-report.${WHOLE_REPORT_TRANSLATION_PROMPT_VERSION}`,
      });
      if (result.outcome === "failed") {
        setState({ phase: "failed", rawText: result.rawText });
        return;
      }

      // P-56 (ai-katmani-temizligi.md §2): a second, independent structured
      // call for the three project-header fields — a failure here never
      // aborts the whole flow (the report's own translation already
      // succeeded), it only means the header mini-panel stays empty, with a
      // visible notice explaining why.
      const metaHeaderNotices: string[] = [];
      let metaHeaderLines: readonly MetaHeaderTranslationLine[] = [];
      const metaHeaderPromptFile = getWholeProjectPromptFile("translate-project-header", META_HEADER_TRANSLATION_PROMPT_VERSION);
      if (!metaHeaderPromptFile) {
        metaHeaderNotices.push(t("workspace.translateReport.missingMetaHeaderPromptFile"));
      } else {
        const metaHeaderResult = await proposeMetaHeaderTranslation({
          promptBody: metaHeaderPromptFile.body,
          meta: { title: project.meta.title, customer: project.meta.customer, partName: project.meta.partName },
          targetLanguage,
          modelId,
          redaction: resolveRedactionPolicy(project.meta.ai.redaction),
          projectId: project.id,
          promptVersion: `translate-project-header.${META_HEADER_TRANSLATION_PROMPT_VERSION}`,
        });
        if (metaHeaderResult.outcome === "success") {
          metaHeaderLines = metaHeaderResult.lines;
          metaHeaderNotices.push(...metaHeaderResult.droppedNotes);
        } else if (metaHeaderResult.outcome === "failed") {
          metaHeaderNotices.push(t("workspace.translateReport.metaHeaderFailed"));
        }
      }

      setState({
        phase: "review",
        diff: result.diff,
        notices: [...droppedNotes, ...result.droppedNotes, ...metaHeaderNotices],
        selected: new Set(result.diff.lines.map((_, index) => index)),
        metaHeaderLines,
        metaHeaderSelected: new Set(metaHeaderLines.map((line) => line.field)),
      });
    } catch (error) {
      setState({ phase: "error", message: errorMessage(error) });
    }
  }

  function toggleLine(index: number) {
    if (state.phase !== "review") {
      return;
    }
    const next = new Set(state.selected);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setState({ ...state, selected: next });
  }

  function toggleMetaHeaderLine(field: MetaHeaderField) {
    if (state.phase !== "review") {
      return;
    }
    const next = new Set(state.metaHeaderSelected);
    if (next.has(field)) {
      next.delete(field);
    } else {
      next.add(field);
    }
    setState({ ...state, metaHeaderSelected: next });
  }

  function handleApply() {
    if (state.phase !== "review" || !project || !modelId) {
      return;
    }
    // Rebuilt fresh, same reasoning as `LayoutReviewPanel.handleApply` — the
    // diff may sit under review for a while before Apply, and a stale lookup
    // could write against an entry that has since changed or been removed.
    const liveLookup = buildEntryLookup(project);
    const acceptedBy = project.meta.owner.name;
    let count = 0;

    state.diff.lines.forEach((line, index) => {
      if (!state.selected.has(index)) {
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
        model: {
          providerId: "vorion",
          modelId,
          promptVersion: `translate-report.${WHOLE_REPORT_TRANSLATION_PROMPT_VERSION}`,
        },
        generatedAt: now,
        acceptedBy,
        acceptedAt: now,
        editDistance: normalizedEditDistance(originalText, line.translatedText),
      };
      const { entry, step, stepId } = found;
      if (line.field === "title") {
        dispatch(
          buildUpdateEntryCommand(step, stepId, entry.id, {
            title: line.translatedText,
            payload: entry.payload,
            now,
            provenance,
          }),
        );
        count += 1;
        return;
      }
      const payload = entry.payload;
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        return;
      }
      const nextPayload = { ...(payload as Record<string, unknown>), [line.field]: line.translatedText };
      dispatch(
        buildUpdateEntryCommand(step, stepId, entry.id, { title: entry.title, payload: nextPayload, now, provenance }),
      );
      count += 1;
    });

    // P-56 (ai-katmani-temizligi.md §2): a single whole-slice-replace
    // dispatch for whichever meta-header fields are selected — freshly read
    // `project.meta` (not `state`'s snapshot), same "never write against
    // stale state" reasoning as `liveLookup` above. An unselected field
    // keeps its own current live value, never the stale one captured at
    // Analyze time.
    const selectedMetaHeaderLines = state.metaHeaderLines.filter((line) => state.metaHeaderSelected.has(line.field));
    if (selectedMetaHeaderLines.length > 0) {
      const nextHeader = {
        title: project.meta.title,
        customer: project.meta.customer,
        partName: project.meta.partName,
      };
      for (const line of selectedMetaHeaderLines) {
        nextHeader[line.field] = line.translatedText;
      }
      dispatch(buildSetMetaHeaderCommand(project, nextHeader));
      count += selectedMetaHeaderLines.length;
    }

    setState({ phase: "applied", count });
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
      <p className="font-body text-sm text-ink-muted">{t("workspace.translateReport.intro")}</p>

      {(state.phase === "idle" || state.phase === "error") && (
        <div className="flex flex-col gap-2">
          {state.phase === "error" && (
            <p role="alert" className="font-body text-sm text-danger">
              {state.message}
            </p>
          )}
          <Button type="button" onClick={() => void handleAnalyze()}>
            {t(`workspace.translateReport.analyzeFor.${targetLanguage}`)}
          </Button>
        </div>
      )}

      {state.phase === "loading" && (
        <p className="font-body text-sm text-ink-muted">{t("workspace.translateReport.analyzing")}</p>
      )}

      {state.phase === "failed" && (
        <div className="flex flex-col gap-2">
          <p role="alert" className="font-body text-sm text-danger">
            {t("workspace.translateReport.failed")}
          </p>
          <pre className="max-h-40 overflow-y-auto whitespace-pre-wrap rounded-control border border-border bg-surface p-2 font-mono text-2xs text-ink-muted">
            {state.rawText}
          </pre>
          <Button type="button" variant="ghost" onClick={handleReject}>
            {t("workspace.translateReport.retry")}
          </Button>
        </div>
      )}

      {state.phase === "applied" && (
        <div className="flex flex-col gap-2">
          <p className="font-body text-sm text-ink">{t("workspace.translateReport.appliedSummary", { count: state.count })}</p>
          <Button type="button" variant="ghost" onClick={() => setState({ phase: "idle" })}>
            {t("workspace.translateReport.analyzeAgain")}
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

          {state.metaHeaderLines.length > 0 && (
            <div className="flex flex-col gap-2">
              <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
                {t("workspace.translateReport.projectHeaderHeading")}
              </span>
              {state.metaHeaderLines.map((line) => (
                <label
                  key={line.field}
                  className="flex items-start gap-2 rounded-control border border-border bg-surface p-2"
                >
                  <Checkbox
                    checked={state.metaHeaderSelected.has(line.field)}
                    onCheckedChange={() => toggleMetaHeaderLine(line.field)}
                  />
                  <span className="flex flex-col gap-1">
                    <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
                      {t(`workspace.translateReport.metaFieldLabel.${line.field}`)}
                    </span>
                    <span className="font-body text-xs text-ink-muted line-through">{line.originalText}</span>
                    <span className="font-body text-sm text-ink">{line.translatedText}</span>
                  </span>
                </label>
              ))}
            </div>
          )}

          {state.diff.lines.length === 0 && state.metaHeaderLines.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">{t("workspace.translateReport.noneProposed")}</p>
          ) : (
            <div className="flex flex-col gap-2">
              {state.diff.lines.map((line, index) => {
                const originalText = lookupCondensableText(lookup, line.entryId, line.field);
                return (
                  <label
                    key={`${line.entryId}-${line.field}-${index}`}
                    className="flex items-start gap-2 rounded-control border border-border bg-surface p-2"
                  >
                    <Checkbox checked={state.selected.has(index)} onCheckedChange={() => toggleLine(index)} />
                    <span className="flex flex-col gap-1">
                      <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
                        {entryLabel(lookup, line.entryId)} · {line.field}
                      </span>
                      {originalText !== undefined && (
                        <span className="font-body text-xs text-ink-muted line-through">{originalText}</span>
                      )}
                      <span className="font-body text-sm text-ink">{line.translatedText}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="flex gap-2">
            <Button
              type="button"
              onClick={handleApply}
              disabled={state.selected.size === 0 && state.metaHeaderSelected.size === 0}
            >
              {t("workspace.translateReport.applySelected")}
            </Button>
            <Button type="button" variant="ghost" onClick={handleReject}>
              {t("workspace.translateReport.rejectAll")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
