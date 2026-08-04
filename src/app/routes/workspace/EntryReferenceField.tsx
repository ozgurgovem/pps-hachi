import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EntryReference, ProjectModel } from "../../../domain/model";
import { listReferenceableEntries } from "../../../domain/selectors";
import type { MethodReferenceRole } from "../../../methods";
import { getMethodById } from "../../../methods";
import { Badge, Button, Input, Label } from "../../../ui";

interface EntryReferenceFieldProps {
  project: ProjectModel;
  role: MethodReferenceRole;
  /** The entry's full reference list — every role, not just this one. */
  references: readonly EntryReference[];
  /** Replaces the whole list; this field only ever rewrites its own role's slice. */
  onChange: (references: readonly EntryReference[]) => void;
  /** Absent while creating — a brand-new entry cannot be its own target anyway. */
  currentEntryId?: string | undefined;
}

/**
 * D-116's UI half: one generic picker, driven by a `MethodReferenceRole` the
 * plugin declares, writing `Entry.references[]`. No method renders this and
 * no method knows it exists — a new relation is a declaration, not a
 * component.
 *
 * Deliberately built from `src/ui` primitives (filter `Input` + a listbox of
 * buttons) rather than a combobox dependency: the candidate list is a handful
 * of entries from two or three steps, and a plain filtered list is keyboard
 * navigable and screen-reader legible without new machinery.
 */
export function EntryReferenceField({
  project,
  role,
  references,
  onChange,
  currentEntryId,
}: EntryReferenceFieldProps) {
  const { t } = useTranslation();
  const [filter, setFilter] = useState("");
  const filterId = useId();

  const candidates = useMemo(
    () => listReferenceableEntries(project, role.fromSteps, currentEntryId),
    [project, role.fromSteps, currentEntryId],
  );

  const selected = references.filter((reference) => reference.role === role.role);
  const selectedIds = new Set(selected.map((reference) => reference.targetEntryId));

  const needle = filter.trim().toLocaleLowerCase(project.meta.language);
  const visible = candidates.filter(
    (candidate) =>
      !selectedIds.has(candidate.entryId) &&
      (needle.length === 0 || candidate.entryTitle.toLocaleLowerCase(project.meta.language).includes(needle)),
  );

  /** Rewrites this role's slice in place, leaving every other role — including one a newer build wrote — untouched. */
  function replaceRole(nextForRole: readonly EntryReference[]) {
    onChange([...references.filter((reference) => reference.role !== role.role), ...nextForRole]);
  }

  function add(targetEntryId: string) {
    const next = { role: role.role, targetEntryId };
    replaceRole(role.multiple ? [...selected, next] : [next]);
    setFilter("");
  }

  function remove(targetEntryId: string) {
    replaceRole(selected.filter((reference) => reference.targetEntryId !== targetEntryId));
  }

  return (
    <fieldset className="flex flex-col gap-2 rounded-control border border-border p-3">
      <legend className="px-1 font-display text-sm font-semibold">{t(role.labelKey)}</legend>

      {selected.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">{t(role.emptyKey)}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {selected.map((reference) => {
            const target = candidates.find((candidate) => candidate.entryId === reference.targetEntryId);
            const method = target ? getMethodById(target.methodId) : undefined;
            return (
              <li key={reference.targetEntryId} className="flex items-center gap-2">
                {target ? (
                  <>
                    <Badge>{t(`workspace.steps.${target.stepId}.name`)}</Badge>
                    <span className="flex-1 truncate font-body text-sm">{target.entryTitle}</span>
                    {method && (
                      <span className="font-mono text-2xs text-ink-muted">{t(method.nameKey)}</span>
                    )}
                  </>
                ) : (
                  /*
                   * D-117: a dangling reference is shown, never silently
                   * dropped and never repaired on the user's behalf. The
                   * warning *view* is Phase 7's; being honest here costs one
                   * branch and keeps the entry editable meanwhile.
                   */
                  <span className="flex-1 truncate font-body text-sm text-ink-muted">
                    {t("workspace.references.missing", { id: reference.targetEntryId })}
                  </span>
                )}
                <Button
                  variant="ghost"
                  onClick={() => remove(reference.targetEntryId)}
                  aria-label={t("workspace.references.remove", {
                    title: target?.entryTitle ?? reference.targetEntryId,
                  })}
                >
                  {t("workspace.references.removeShort")}
                </Button>
              </li>
            );
          })}
        </ul>
      )}

      {(role.multiple || selected.length === 0) && (
        <div className="flex flex-col gap-1.5">
          <Label htmlFor={filterId}>{t("workspace.references.searchLabel")}</Label>
          <Input
            id={filterId}
            value={filter}
            placeholder={t("workspace.references.searchPlaceholder")}
            onChange={(event) => setFilter(event.target.value)}
          />
          {candidates.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">{t("workspace.references.noCandidates")}</p>
          ) : visible.length === 0 ? (
            <p className="font-body text-sm text-ink-muted">{t("workspace.references.noMatches")}</p>
          ) : (
            <ul className="max-h-40 overflow-y-auto rounded-control border border-border">
              {visible.map((candidate) => (
                <li key={candidate.entryId}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 px-2 py-1.5 text-left font-body text-sm hover:bg-surface-raised focus-visible:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent"
                    onClick={() => add(candidate.entryId)}
                  >
                    <Badge>{t(`workspace.steps.${candidate.stepId}.name`)}</Badge>
                    <span className="truncate">{candidate.entryTitle}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </fieldset>
  );
}
