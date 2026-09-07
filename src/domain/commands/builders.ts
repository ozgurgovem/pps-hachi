import type {
  A3Visibility,
  AiMeta,
  Entry,
  EntryReference,
  ImageRef,
  ProjectInfoFields,
  ProjectModel,
  Provenance,
  Round,
  SignOffEntry,
  StepId,
  StepState,
} from "../model";
import {
  type EntryInsertCommand,
  type EntryRemoveCommand,
  type EntrySetA3VisibilityCommand,
  type EntryUpdateCommand,
  type EntriesReorderCommand,
  type MetaAiSetCommand,
  type MetaProjectInfoSetCommand,
  type RoundsSetCommand,
  type SignOffSetCommand,
  type TemplateIdSetCommand,
} from "./types";

/**
 * Pure `Command` factories — no React, no Tauri, no i18next (domain purity
 * boundary, D-43). These decide *what a user action means* (a fresh id, the
 * next `order`, an "(copy)" title); `applyCommand` decides how to fold that
 * into `ProjectModel`. Kept separate so the dispatcher never has to special-
 * case "is this a brand-new entry" — by the time a command exists, it
 * already carries a complete `Entry`.
 */

function findEntryOrThrow(step: StepState, entryId: string): Entry {
  const entry = step.entries.find((e) => e.id === entryId);
  if (!entry) {
    throw new Error(`No entry with id "${entryId}" in this step`);
  }
  return entry;
}

export interface AddEntryInput {
  methodId: string;
  title: string;
  payload: unknown;
  now: string;
  /**
   * D-116: cross-step references travel on the `Entry`, beside `payload`
   * rather than inside it. Omitted (not `[]`) when the method declares no
   * reference roles, so an entry from a method that holds no relation is
   * byte-identical to one written before 6b existed.
   */
  references?: readonly EntryReference[] | undefined;
  /** D-149(6d): omitted means the entry starts untagged — no round exists yet in most projects. */
  roundId?: string | undefined;
  /**
   * D-118/D-193: an image can be imported before the entry itself is saved
   * (the create dialog's `createImages` local state, same shape
   * `createReferences`/`createRoundId` already use) — omitted starts the
   * entry with no images, matching `Entry.images`'s always-an-array shape
   * (never `undefined`, unlike `references`).
   */
  images?: readonly ImageRef[] | undefined;
  /**
   * D-15/D-18/D-201: omitted means `{ origin: "human" }`, this builder's
   * pre-existing default — every call site before the Assistant panel wrote
   * an entry by hand and stays byte-identical. The Assistant's Accept
   * button is the first caller to pass `{ origin: "ai-accepted", model,
   * generatedAt, acceptedBy, acceptedAt }` explicitly; there is still no
   * other path from a model response into `ProjectModel` (D-15 LOCKED).
   */
  provenance?: Provenance | undefined;
}

/** Drops an empty list rather than storing `references: []` — see `AddEntryInput.references`. */
function referenceFields(references: readonly EntryReference[] | undefined): Pick<Entry, "references"> | undefined {
  return references && references.length > 0 ? { references: [...references] } : undefined;
}

/**
 * Clearing the last reference must remove the key entirely, not leave
 * `references: []` — an entry that never held one and an entry whose last
 * one was removed have to serialize identically.
 */
function withoutReferences(entry: Entry): Entry {
  const copy: Entry = { ...entry };
  delete copy.references;
  return copy;
}

/** Same reasoning as `withoutReferences`, one field over. */
function withoutRoundId(entry: Entry): Entry {
  const copy: Entry = { ...entry };
  delete copy.roundId;
  return copy;
}

export function buildAddEntryCommand(step: StepState, stepId: StepId, input: AddEntryInput): EntryInsertCommand {
  const entry: Entry = {
    id: crypto.randomUUID(),
    methodId: input.methodId,
    title: input.title,
    order: step.entries.length,
    a3Visibility: "primary",
    payload: input.payload,
    images: input.images ? [...input.images] : [],
    createdAt: input.now,
    updatedAt: input.now,
    provenance: input.provenance ?? { origin: "human" },
    ...referenceFields(input.references),
    ...(input.roundId === undefined ? undefined : { roundId: input.roundId }),
  };
  return { type: "entry.insert", stepId, entry, index: step.entries.length, undoable: true };
}

export interface UpdateEntryInput {
  title: string;
  payload: unknown;
  now: string;
  /**
   * Absent means "leave whatever references this entry already has alone" —
   * the title and payload edit paths (`EntryEditorDialog`) each call this
   * builder without knowing about references. Present (including empty)
   * replaces the whole list, which is how the picker clears the last one.
   */
  references?: readonly EntryReference[] | undefined;
  /**
   * D-149(6d): three-state, the same shape `nodeTree.ts`'s `parentId`
   * already uses for "explicitly none" — `undefined`/omitted leaves
   * whatever round tag this entry already has alone, `null` clears it,
   * a string sets/replaces it.
   */
  roundId?: string | null | undefined;
  /**
   * D-118/D-193: absent means "leave whatever images this entry already
   * has alone" — same posture as `references` above, and for the same
   * reason (the title/payload edit paths call this builder with no idea
   * whether an image was just imported). Present (including `[]`) replaces
   * the whole list, which is how removing the last image works.
   */
  images?: readonly ImageRef[] | undefined;
  /**
   * J1: absent means "leave whatever provenance this entry already has
   * alone" — the same posture `references`/`images` already take, and for
   * the same reason: every pre-existing edit path (title keystrokes, the
   * plugin's own `Editor`) has no opinion on provenance and must not
   * silently reset an `ai-accepted`/`ai-edited` entry back to unmarked.
   * `EntryProposalField`'s Accept-onto-an-existing-entry path is the first
   * caller to pass this explicitly (D-15's Accept step, applied to an
   * update rather than a fresh insert).
   */
  provenance?: Provenance | undefined;
}

export function buildUpdateEntryCommand(
  step: StepState,
  stepId: StepId,
  entryId: string,
  input: UpdateEntryInput,
): EntryUpdateCommand {
  const before = findEntryOrThrow(step, entryId);
  const nextReferences = input.references === undefined ? before.references : input.references;
  const nextRoundId = input.roundId === undefined ? before.roundId : (input.roundId ?? undefined);
  const nextImages = input.images === undefined ? before.images : input.images;
  const nextProvenance = input.provenance === undefined ? before.provenance : input.provenance;
  const after: Entry = {
    ...withoutRoundId(withoutReferences(before)),
    title: input.title,
    payload: input.payload,
    images: [...nextImages],
    updatedAt: input.now,
    provenance: nextProvenance,
    ...referenceFields(nextReferences),
    ...(nextRoundId === undefined ? undefined : { roundId: nextRoundId }),
  };
  return { type: "entry.update", stepId, entryId, before, after, undoable: true };
}

export function buildDeleteEntryCommand(step: StepState, stepId: StepId, entryId: string): EntryRemoveCommand {
  const entry = findEntryOrThrow(step, entryId);
  const index = step.entries.findIndex((e) => e.id === entryId);
  return { type: "entry.remove", stepId, entry, index, undoable: true };
}

export interface DuplicateEntryInput {
  now: string;
  newId: string;
}

export function buildDuplicateEntryCommand(
  step: StepState,
  stepId: StepId,
  entryId: string,
  input: DuplicateEntryInput,
): EntryInsertCommand {
  const source = findEntryOrThrow(step, entryId);
  const copy: Entry = {
    ...source,
    id: input.newId,
    title: `${source.title} (copy)`,
    createdAt: input.now,
    updatedAt: input.now,
  };
  const sourceIndex = step.entries.findIndex((e) => e.id === entryId);
  return { type: "entry.insert", stepId, entry: copy, index: sourceIndex + 1, undoable: true };
}

/** Returns `null` (no command to dispatch) when the entry is already at `toIndex`. */
export function buildReorderCommand(
  step: StepState,
  stepId: StepId,
  entryId: string,
  toIndex: number,
): EntriesReorderCommand | null {
  const before = step.entries.map((e) => e.id);
  const fromIndex = before.indexOf(entryId);
  if (fromIndex === -1) {
    throw new Error(`No entry with id "${entryId}" in this step`);
  }
  if (fromIndex === toIndex) {
    return null;
  }
  const after = [...before];
  const removed = after.splice(fromIndex, 1);
  const moved = removed[0];
  if (moved === undefined) {
    throw new Error("unreachable: fromIndex was already validated against this array");
  }
  after.splice(toIndex, 0, moved);
  return { type: "entries.reorder", stepId, before, after, undoable: true };
}

export function buildSetA3VisibilityCommand(
  step: StepState,
  stepId: StepId,
  entryId: string,
  visibility: A3Visibility,
): EntrySetA3VisibilityCommand {
  const entry = findEntryOrThrow(step, entryId);
  return {
    type: "entry.setA3Visibility",
    stepId,
    entryId,
    before: entry.a3Visibility,
    after: visibility,
    undoable: true,
  };
}

/**
 * D-149(6d)/D-58: opens a new round, closing any still-open one first
 * (`closedAt === undefined` is "open" — a round is never reopened once
 * closed). Project-level, no `stepId` — `Round` carries no snapshot of the
 * entries opened under it, so this never touches `steps`.
 */
export function buildOpenRoundCommand(project: ProjectModel, reason: string, now: string): RoundsSetCommand {
  const before = project.rounds;
  const closedPrevious = before.map((round) => (round.closedAt === undefined ? { ...round, closedAt: now } : round));
  const opened: Round = { id: crypto.randomUUID(), openedAt: now, reason };
  return { type: "rounds.set", before, after: [...closedPrevious, opened], undoable: true };
}

/**
 * D-149(6d): sets or clears exactly one of `preparedBy`/`reviewedBy`/
 * `approvedBy`, leaving the other two untouched — mirrors `referenceFields`'
 * "replace this slice only" shape one level over, project rather than entry.
 */
export function buildSetSignOffCommand(
  project: ProjectModel,
  role: "preparedBy" | "reviewedBy" | "approvedBy",
  entry: SignOffEntry | undefined,
): SignOffSetCommand {
  const before = project.signOff;
  const after = { ...before };
  if (entry === undefined) {
    delete after[role];
  } else {
    after[role] = entry;
  }
  return { type: "signOff.set", before, after, undoable: true };
}

/**
 * D-201: sets the whole `meta.ai` slice at once — unlike `buildSetSignOffCommand`'s
 * single-role patch, every caller today (the Settings screen's temporary
 * debug toggle) already has the complete next value in hand, so there is no
 * partial-update case to preserve.
 */
export function buildSetAiMetaCommand(project: ProjectModel, ai: AiMeta): MetaAiSetCommand {
  return { type: "meta.ai.set", before: project.meta.ai, after: ai, undoable: true };
}

/**
 * Faz 11/L1 (D-223): sets the whole `priority`/`targetClosureDate`/
 * `generalRag` slice at once, same posture as `buildSetAiMetaCommand` —
 * the Settings screen's "Proje Bilgileri" form always has the current
 * values of all three fields in hand (it renders them), so there is no
 * partial-update case to preserve.
 */
export function buildSetProjectInfoCommand(project: ProjectModel, info: ProjectInfoFields): MetaProjectInfoSetCommand {
  const before: ProjectInfoFields = {
    priority: project.meta.priority,
    targetClosureDate: project.meta.targetClosureDate,
    generalRag: project.meta.generalRag,
  };
  return { type: "meta.projectInfo.set", before, after: info, undoable: true };
}

/**
 * Faz 11/L2: switches which template `project` exports through. Never
 * touches any entry's `a3Visibility` — a target template's own block budget
 * (D-100's `droppedEntryIds`) decides which `primary` entries actually land
 * on the A3 sheet at export/preview time; switching back restores whatever
 * fit before, with no compensating logic needed here.
 */
export function buildSetTemplateIdCommand(project: ProjectModel, templateId: string): TemplateIdSetCommand {
  return { type: "templateId.set", before: project.templateId, after: templateId, undoable: true };
}
