import type { A3Visibility, Entry, StepId, StepState } from "../model";
import {
  type EntryInsertCommand,
  type EntryRemoveCommand,
  type EntrySetA3VisibilityCommand,
  type EntryUpdateCommand,
  type EntriesReorderCommand,
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
}

export function buildAddEntryCommand(step: StepState, stepId: StepId, input: AddEntryInput): EntryInsertCommand {
  const entry: Entry = {
    id: crypto.randomUUID(),
    methodId: input.methodId,
    title: input.title,
    order: step.entries.length,
    a3Visibility: "primary",
    payload: input.payload,
    images: [],
    createdAt: input.now,
    updatedAt: input.now,
    provenance: { origin: "human" },
  };
  return { type: "entry.insert", stepId, entry, index: step.entries.length, undoable: true };
}

export interface UpdateEntryInput {
  title: string;
  payload: unknown;
  now: string;
}

export function buildUpdateEntryCommand(
  step: StepState,
  stepId: StepId,
  entryId: string,
  input: UpdateEntryInput,
): EntryUpdateCommand {
  const before = findEntryOrThrow(step, entryId);
  const after: Entry = { ...before, title: input.title, payload: input.payload, updatedAt: input.now };
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
