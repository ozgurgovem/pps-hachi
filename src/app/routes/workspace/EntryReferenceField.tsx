import { useId, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { EntryReference, ProjectModel } from "../../../domain/model";
import { listReferenceableEntries, type ReferenceableEntry } from "../../../domain/selectors";
import type { MethodReferenceRole } from "../../../methods";
import { getMethodById } from "../../../methods";
import { flattenTree } from "../../../methods/shared/nodeTree";
import { confirmedRootCauseNumbers } from "../../../methods/whyWhyTree/outcome";
import { WhyWhyTreePayloadSchema } from "../../../methods/whyWhyTree/schema";
import {
  Badge,
  Button,
  Input,
  Label,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
} from "../../../ui";

/**
 * D-185/P-39: matched literally, not through `D-99`'s `A3EntryRenderer`
 * contract — this generic shell already knows a candidate's `methodId`
 * (D-125's own boundary is "no plugin *renders* this field," not "the
 * field may never look at a methodId"). Kept as a literal rather than
 * importing `src/methods/whyWhyTree`'s own `WHY_WHY_TREE_METHOD_ID` so this
 * file never pulls in that method's `Editor`/`WhyWhyTreeDiagram` (React
 * Flow) bundle — only its pure, non-React `outcome.ts`/`schema.ts`.
 */
const WHY_WHY_TREE_METHOD_ID = "why-why-tree";

const NO_NODE = "__none__";
/** Two non-breaking spaces per depth level — a plain space collapses under normal CSS white-space handling inside a `<Select.Item>`. */
const NODE_INDENT = "\u00A0\u00A0";

/**
 * The second, optional level D-185/P-39 adds: once a `whyWhyTree` entry is
 * targeted, narrow the reference to one of its nodes. Reuses the tree's own
 * `confirmedRootCauseNumbers`/`flattenTree` rather than re-deriving KN{N}
 * numbering a third time (D-71 — the Editor and the exported diagram must
 * never disagree with a picker about which KN is which).
 */
function WhyWhyTreeNodePicker({
  project,
  target,
  targetNodeId,
  onSelect,
}: {
  project: ProjectModel;
  target: ReferenceableEntry;
  targetNodeId: string | undefined;
  onSelect: (nodeId: string | undefined) => void;
}) {
  const { t } = useTranslation();
  const fieldId = useId();
  const targetEntry = project.steps[target.stepId].entries.find(
    (candidate) => candidate.id === target.entryId,
  );
  const parsed = targetEntry ? WhyWhyTreePayloadSchema.safeParse(targetEntry.payload) : undefined;
  const nodes = parsed?.success ? parsed.data.nodes : [];

  if (nodes.length === 0) {
    return null;
  }

  const knNumbers = confirmedRootCauseNumbers(nodes);
  const options = flattenTree(nodes).map(({ node, depth }) => {
    const text = node.text.trim().length > 0 ? node.text.trim() : t("workspace.references.nodeUntitled");
    const kn = knNumbers.get(node.id);
    return {
      id: node.id,
      label: `${NODE_INDENT.repeat(depth)}${text}${kn !== undefined ? ` (KN${kn})` : ""}`,
    };
  });

  /*
   * D-117's own honesty rule applied one level down: a `targetNodeId` the
   * current tree no longer carries (the node was deleted) is shown as its
   * own item rather than silently falling back to "no specific node."
   */
  const hasCurrentNode = targetNodeId === undefined || options.some((option) => option.id === targetNodeId);

  return (
    <div className="flex flex-col gap-1 pl-4">
      <Label htmlFor={fieldId} className="text-2xs text-ink-muted">
        {t("workspace.references.nodeLabel")}
      </Label>
      <SelectRoot
        value={targetNodeId ?? NO_NODE}
        onValueChange={(next) => onSelect(next === NO_NODE ? undefined : next)}
      >
        <SelectTrigger id={fieldId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={NO_NODE}>{t("workspace.references.nodeNone")}</SelectItem>
          {!hasCurrentNode && targetNodeId !== undefined && (
            <SelectItem value={targetNodeId}>{t("workspace.references.nodeMissing")}</SelectItem>
          )}
          {options.map((option) => (
            <SelectItem key={option.id} value={option.id}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
}

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

  /** D-185/P-39: narrows (or clears) one existing reference's `targetNodeId` in place. */
  function setNode(targetEntryId: string, nodeId: string | undefined) {
    replaceRole(
      selected.map((reference) => {
        if (reference.targetEntryId !== targetEntryId) {
          return reference;
        }
        return nodeId === undefined
          ? { role: reference.role, targetEntryId: reference.targetEntryId }
          : { ...reference, targetNodeId: nodeId };
      }),
    );
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
              <li key={reference.targetEntryId} className="flex flex-col gap-1.5">
                <div className="flex items-center gap-2">
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
                </div>
                {target && target.methodId === WHY_WHY_TREE_METHOD_ID && (
                  <WhyWhyTreeNodePicker
                    project={project}
                    target={target}
                    targetNodeId={reference.targetNodeId}
                    onSelect={(nodeId) => setNode(reference.targetEntryId, nodeId)}
                  />
                )}
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
