import type { A3Visibility, Entry, Round, SignOffState, StepId } from "../model";

/**
 * D-70: every mutation to `ProjectModel` is one of these, dispatched through
 * `applyCommand` — no other code path is allowed to touch `steps` directly.
 * JSON-serializable by construction (no functions, no class instances),
 * because the undo stack needs to survive nothing more exotic than sitting
 * in a plain array.
 *
 * D-80: `undoable` lives on every command from Phase 3 on even though
 * nothing sets it `false` yet — a future non-undoable action (sign-off) needs
 * the dispatcher to already understand the concept.
 */
interface BaseCommand {
  readonly undoable: boolean;
}

export interface EntryInsertCommand extends BaseCommand {
  readonly type: "entry.insert";
  readonly stepId: StepId;
  readonly entry: Entry;
  readonly index: number;
}

export interface EntryRemoveCommand extends BaseCommand {
  readonly type: "entry.remove";
  readonly stepId: StepId;
  readonly entry: Entry;
  readonly index: number;
}

export interface EntryUpdateCommand extends BaseCommand {
  readonly type: "entry.update";
  readonly stepId: StepId;
  readonly entryId: string;
  readonly before: Entry;
  readonly after: Entry;
}

export interface EntrySetA3VisibilityCommand extends BaseCommand {
  readonly type: "entry.setA3Visibility";
  readonly stepId: StepId;
  readonly entryId: string;
  readonly before: A3Visibility;
  readonly after: A3Visibility;
}

/**
 * D-71/D-14: id arrays, not full `Entry[]` snapshots — a reorder is a
 * permutation, and storing two full copies of a step's entries per drag
 * (up to 100 deep) is wasted memory for information a list of ids already
 * captures. `applyCommand` looks each id up in the step's current entries.
 */
export interface EntriesReorderCommand extends BaseCommand {
  readonly type: "entries.reorder";
  readonly stepId: StepId;
  readonly before: readonly string[];
  readonly after: readonly string[];
}

/**
 * D-58/D-149(6d): project-level, not step-scoped — unlike every command
 * above, `rounds` lives on `ProjectModel` itself. `before`/`after` are full
 * array values (the round count is always small, D-71's array-position
 * discipline doesn't buy anything here the way it does for a 100-entry
 * reorder).
 */
export interface RoundsSetCommand extends BaseCommand {
  readonly type: "rounds.set";
  readonly before: readonly Round[];
  readonly after: readonly Round[];
}

/** Project-level, same reasoning as `RoundsSetCommand`. */
export interface SignOffSetCommand extends BaseCommand {
  readonly type: "signOff.set";
  readonly before: SignOffState;
  readonly after: SignOffState;
}

export type Command =
  | EntryInsertCommand
  | EntryRemoveCommand
  | EntryUpdateCommand
  | EntrySetA3VisibilityCommand
  | EntriesReorderCommand
  | RoundsSetCommand
  | SignOffSetCommand;

/**
 * D-70: thrown by `applyCommand` when a command's precondition doesn't hold
 * against the project it's being applied to (its target entry no longer
 * exists, or a reorder's recorded id set doesn't match current entries) —
 * the dispatcher clears the undo/redo stack and surfaces this rather than
 * half-applying a command against state it no longer describes.
 */
export class CommandPreconditionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CommandPreconditionError";
  }
}
