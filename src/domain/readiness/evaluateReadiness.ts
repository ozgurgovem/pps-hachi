import { STEP_IDS, type Entry, type ProjectModel, type StepId } from "../model";
import type { ReadinessResult, ReadinessRule, ReadinessWarning } from "./types";

/**
 * D-196: `Entry.payload` is opaque (`z.unknown()`, D-52) — every rule below
 * reads it defensively, the same posture `RowTableEditor.tsx`'s `?? ""` fix
 * (Oturum C1) already established for this exact bug class. Deliberately no
 * imports from `src/methods/*` anywhere in this file: methodId strings and
 * shapes are duplicated as literals rather than imported, because a method's
 * `index.ts` re-exports its React `Editor` alongside its id constant, and an
 * import of either would pull React into `src/domain` at the module-graph
 * level even though ESLint's `no-restricted-imports` (which only matches
 * literal specifiers like `'react'`) would not catch it — see
 * `eslint.config.js`'s `pureModuleBoundary` comment on why that purity
 * matters (golden-testability, no layout logic outside Rust).
 */
function asRecord(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? (value as Record<string, unknown>) : {};
}

function isNonBlankString(value: unknown): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function arrayField(payload: unknown, key: string): readonly unknown[] {
  const value = asRecord(payload)[key];
  return Array.isArray(value) ? value : [];
}

function warning(rule: ReadinessRule, messageKey: string): ReadinessWarning {
  return { rule, messageKey: `workspace.readiness.${messageKey}` };
}

/**
 * SPEC.md §1.2 S1: "gap must be quantified (a number + unit + baseline
 * period)." D-196 adds `gapValue`/`unit`/`baselinePeriod` to `gapStatement`
 * for exactly this check. `gapValue !== 0` is a documented heuristic, not a
 * precise "is this set" test — `createEmptyPayload` defaults it to `0` and
 * the schema has no separate "unset" state (`z.number()`, not optional), the
 * same accepted false-positive-on-a-genuine-zero tradeoff S3 already takes
 * on `smartTarget`'s `baseline`/`target` below. Cheap and non-blocking
 * (SPEC's own "advisory", never a hard gate) makes the tradeoff acceptable.
 */
function evaluateS1(entries: readonly Entry[]): ReadinessWarning[] {
  const quantified = entries.some((entry) => {
    if (entry.methodId !== "gap-statement") return false;
    const payload = asRecord(entry.payload);
    return (
      typeof payload.gapValue === "number" &&
      payload.gapValue !== 0 &&
      isNonBlankString(payload.unit) &&
      isNonBlankString(payload.baselinePeriod)
    );
  });
  return quantified ? [] : [warning("S1", "s1")];
}

/**
 * SPEC.md §1.2 S2: "at least one data-based entry (Pareto / trend / check
 * sheet / stratification) must exist ... Also flag if no point-of-cause is
 * nominated." Two independent conditions, so up to two warnings.
 */
function evaluateS2(entries: readonly Entry[]): ReadinessWarning[] {
  const dataBasedMethodIds = new Set(["pareto", "trend", "check-sheet", "stratification-matrix"]);
  const warnings: ReadinessWarning[] = [];

  if (!entries.some((entry) => dataBasedMethodIds.has(entry.methodId))) {
    warnings.push(warning("S2", "s2NoDataEntry"));
  }
  if (!entries.some((entry) => entry.methodId === "point-of-cause")) {
    warnings.push(warning("S2", "s2NoPointOfCause"));
  }
  return warnings;
}

/**
 * SPEC.md §1.2 S3: "target must be SMART — the form has explicit fields for
 * metric, baseline, target value, unit, and due date, and all must be
 * filled." No `smart-target` entry at all also fails this (nothing to be
 * SMART about yet). `baseline`/`target` share S1's "!== 0" heuristic.
 */
function evaluateS3(entries: readonly Entry[]): ReadinessWarning[] {
  const smartTargetEntries = entries.filter((entry) => entry.methodId === "smart-target");
  const allComplete =
    smartTargetEntries.length > 0 &&
    smartTargetEntries.every((entry) => {
      const payload = asRecord(entry.payload);
      return (
        isNonBlankString(payload.metric) &&
        typeof payload.baseline === "number" &&
        payload.baseline !== 0 &&
        typeof payload.target === "number" &&
        payload.target !== 0 &&
        isNonBlankString(payload.unit) &&
        isNonBlankString(payload.dueDate)
      );
    });
  return allComplete ? [] : [warning("S3", "s3")];
}

/**
 * SPEC.md §1.2 S4, mechanical half only (D-195's own AskUserQuestion
 * answer): "flag if no root cause has `verified = true`" reads as either of
 * `hypothesis-verification`'s `rows[].verdict === "confirmed"` or
 * `why-why-tree`'s `nodes[].outcome === "confirmedRootCause"` — either is
 * enough. S4's *second* sentence ("flag if any 5-Why chain terminates on a
 * person") is NOT implemented here — D-195's own scope table never carried
 * it, and detecting "does this text blame a person" is a new heuristic
 * mechanism (NLP/keyword matching) outside G1's one-mechanism budget.
 * Filed as P-46 rather than silently dropped — see `DECISIONS.md` D-196.
 */
function evaluateS4(entries: readonly Entry[]): ReadinessWarning[] {
  const hasConfirmedHypothesis = entries.some(
    (entry) =>
      entry.methodId === "hypothesis-verification" &&
      arrayField(entry.payload, "rows").some((row) => asRecord(row).verdict === "confirmed"),
  );
  const hasConfirmedWhyWhy = entries.some(
    (entry) =>
      entry.methodId === "why-why-tree" &&
      arrayField(entry.payload, "nodes").some((node) => asRecord(node).outcome === "confirmedRootCause"),
  );
  return hasConfirmedHypothesis || hasConfirmedWhyWhy ? [] : [warning("S4", "s4")];
}

/**
 * SPEC.md §1.2 S5: "flag if any countermeasure is not linked to at least one
 * verified root cause. Flag if the countermeasure sits at the bottom of the
 * error-proofing hierarchy ... without a documented reason." Per D-195's own
 * table, "linked" is checked as "holds a `rootCause` reference" — not
 * whether that referenced entry is itself S4-verified (P-39 already defers
 * the node-level reference precision that would require). The hierarchy
 * check reads the `error-proofing-hierarchy` entry(ies) that reference this
 * countermeasure back (`role: "countermeasure"`, `errorProofingHierarchy/
 * index.ts`'s same-step reference).
 */
function evaluateS5(entries: readonly Entry[]): ReadinessWarning[] {
  const countermeasures = entries.filter((entry) => entry.methodId === "countermeasure");
  const hierarchyEntries = entries.filter((entry) => entry.methodId === "error-proofing-hierarchy");
  const warnings: ReadinessWarning[] = [];

  const anyMissingRootCause = countermeasures.some(
    (countermeasure) => !(countermeasure.references ?? []).some((ref) => ref.role === "rootCause"),
  );
  if (anyMissingRootCause) {
    warnings.push(warning("S5", "s5NoVerifiedRootCause"));
  }

  const anyUnjustifiedWeakest = countermeasures.some((countermeasure) => {
    const linkedHierarchyEntries = hierarchyEntries.filter((hierarchy) =>
      (hierarchy.references ?? []).some(
        (ref) => ref.role === "countermeasure" && ref.targetEntryId === countermeasure.id,
      ),
    );
    return linkedHierarchyEntries.some((hierarchy) => {
      const payload = asRecord(hierarchy.payload);
      return payload.level === "procedure" && !isNonBlankString(payload.note);
    });
  });
  if (anyUnjustifiedWeakest) {
    warnings.push(warning("S5", "s5UnjustifiedHierarchy"));
  }

  return warnings;
}

/** SPEC.md §1.2 S6: "flag any action with no owner or no due date." */
function evaluateS6(entries: readonly Entry[]): ReadinessWarning[] {
  const anyIncomplete = entries.some((entry) => {
    if (entry.methodId !== "action-item") return false;
    const payload = asRecord(entry.payload);
    return !isNonBlankString(payload.owner) || !isNonBlankString(payload.dueDate);
  });
  return anyIncomplete ? [warning("S6", "s6")] : [];
}

/**
 * SPEC.md §1.2 S7: "flag if the result is recorded but the process
 * confirmation ... is empty." Read literally rather than D-195's own
 * flattened table entry: only flags when a `result-verdict` entry actually
 * carries a recorded (non-`"pending"`) verdict AND every `sustainment-audit`
 * entry in the step has zero rows — `RoundsBand`/`resultVerdict` are only
 * ever read here, never written (D-192 stays untouched).
 */
function evaluateS7(entries: readonly Entry[]): ReadinessWarning[] {
  const hasRecordedVerdict = entries.some((entry) => {
    if (entry.methodId !== "result-verdict") return false;
    const verdict = asRecord(entry.payload).verdict;
    return isNonBlankString(verdict) && verdict !== "pending";
  });
  if (!hasRecordedVerdict) {
    return [];
  }

  const totalAuditRows = entries
    .filter((entry) => entry.methodId === "sustainment-audit")
    .reduce((sum, entry) => sum + arrayField(entry.payload, "rows").length, 0);
  return totalAuditRows === 0 ? [warning("S7", "s7")] : [];
}

/**
 * SPEC.md §1.2 S8: "flag if no document ... is marked as updated, and flag
 * if the yokoten / read-across table is empty." "Marked as updated" reads as
 * `document-updates-tracker`'s own `status === "complete"`
 * (`DOCUMENT_STATUS_OPTIONS`, §13.2's `Lists & Settings` dictionary) on any
 * of its seven fixed document-type rows — not merely "any field non-blank".
 */
function evaluateS8(entries: readonly Entry[]): ReadinessWarning[] {
  const warnings: ReadinessWarning[] = [];

  const anyDocumentUpdated = entries.some((entry) => {
    if (entry.methodId !== "document-updates-tracker") return false;
    return Object.values(asRecord(entry.payload)).some((row) => asRecord(row).status === "complete");
  });
  if (!anyDocumentUpdated) {
    warnings.push(warning("S8", "s8NoDocumentUpdated"));
  }

  const totalYokotenRows = entries
    .filter((entry) => entry.methodId === "yokoten-tracker")
    .reduce((sum, entry) => sum + arrayField(entry.payload, "rows").length, 0);
  if (totalYokotenRows === 0) {
    warnings.push(warning("S8", "s8YokotenEmpty"));
  }

  return warnings;
}

const RULE_EVALUATORS: Readonly<Record<StepId, (entries: readonly Entry[]) => ReadinessWarning[]>> = {
  1: evaluateS1,
  2: evaluateS2,
  3: evaluateS3,
  4: evaluateS4,
  5: evaluateS5,
  6: evaluateS6,
  7: evaluateS7,
  8: evaluateS8,
};

/**
 * D-196: a step nobody has touched yet never evaluates its rule — an empty
 * step reads as neutral ("empty"), never "flagged". Matches D-192/
 * `WorkspaceShell`'s existing "jumping to an empty step is a reassurance,
 * never a warning" philosophy, and resolves S2's own literal "must exist"
 * wording without making a brand-new project open to every step reading red.
 */
export function evaluateReadiness(project: ProjectModel): Readonly<Record<StepId, ReadinessResult>> {
  const result = {} as Record<StepId, ReadinessResult>;
  for (const stepId of STEP_IDS) {
    const entries = project.steps[stepId].entries;
    const warnings = entries.length === 0 ? [] : RULE_EVALUATORS[stepId](entries);
    result[stepId] = { status: warnings.length === 0 ? "ok" : "flagged", warnings };
  }
  return result;
}
