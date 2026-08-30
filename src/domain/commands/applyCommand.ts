import type { Entry, ProjectModel, StepState } from "../model";
import {
  CommandPreconditionError,
  type Command,
  type MetaAiSetCommand,
  type RoundsSetCommand,
  type SignOffSetCommand,
} from "./types";

/** Every command this function handles carries a `stepId` — the project-scoped ones are routed to `applyToProject` instead. */
type StepScopedCommand = Exclude<Command, RoundsSetCommand | SignOffSetCommand | MetaAiSetCommand>;

type ProjectScopedCommand = RoundsSetCommand | SignOffSetCommand | MetaAiSetCommand;

/** D-71: array position is authoritative; every mutation ends by re-sequencing `order` to match it. */
function resequence(entries: Entry[]): Entry[] {
  return entries.map((entry, index) => (entry.order === index ? entry : { ...entry, order: index }));
}

function sameIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

function applyToStep(step: StepState, command: StepScopedCommand): StepState {
  switch (command.type) {
    case "entry.insert": {
      if (step.entries.some((entry) => entry.id === command.entry.id)) {
        throw new CommandPreconditionError(`Entry "${command.entry.id}" already exists in this step`);
      }
      const index = Math.min(Math.max(command.index, 0), step.entries.length);
      const next = [...step.entries.slice(0, index), command.entry, ...step.entries.slice(index)];
      return { ...step, entries: resequence(next) };
    }

    case "entry.remove": {
      if (!step.entries.some((entry) => entry.id === command.entry.id)) {
        throw new CommandPreconditionError(`Entry "${command.entry.id}" not found in this step`);
      }
      return {
        ...step,
        entries: resequence(step.entries.filter((entry) => entry.id !== command.entry.id)),
      };
    }

    case "entry.update": {
      if (!step.entries.some((entry) => entry.id === command.entryId)) {
        throw new CommandPreconditionError(`Entry "${command.entryId}" not found in this step`);
      }
      return {
        ...step,
        entries: step.entries.map((entry) => (entry.id === command.entryId ? command.after : entry)),
      };
    }

    case "entry.setA3Visibility": {
      if (!step.entries.some((entry) => entry.id === command.entryId)) {
        throw new CommandPreconditionError(`Entry "${command.entryId}" not found in this step`);
      }
      return {
        ...step,
        entries: step.entries.map((entry) =>
          entry.id === command.entryId ? { ...entry, a3Visibility: command.after } : entry,
        ),
      };
    }

    case "entries.reorder": {
      const currentIds = step.entries.map((entry) => entry.id);
      if (!sameIdSet(currentIds, command.before)) {
        throw new CommandPreconditionError("Entry set changed since this reorder was recorded");
      }
      const byId = new Map(step.entries.map((entry) => [entry.id, entry]));
      const reordered = command.after.map((id) => {
        const entry = byId.get(id);
        if (!entry) {
          throw new CommandPreconditionError(`Entry "${id}" not found in this step`);
        }
        return entry;
      });
      return { ...step, entries: resequence(reordered) };
    }
  }
}

/**
 * D-149(6d)/D-201: `rounds`/`signOff`/`meta.ai` live on `ProjectModel`
 * itself, not inside any `StepState` — these project-scoped command types
 * carry no `stepId` at all, so they're applied here rather than routed into
 * `applyToStep`. No precondition check, the same posture `entry.update`'s
 * `before` already has (D-70 trusts the caller built `before` from state it
 * just read).
 */
function applyToProject(project: ProjectModel, command: ProjectScopedCommand): ProjectModel {
  switch (command.type) {
    case "rounds.set":
      return { ...project, rounds: [...command.after] };
    case "signOff.set":
      return { ...project, signOff: command.after };
    case "meta.ai.set":
      return { ...project, meta: { ...project.meta, ai: command.after } };
  }
}

/**
 * D-70: the one function allowed to mutate `ProjectModel`. Every store
 * action, undo and redo routes through this — never a direct `set()` on
 * `steps`, so the 100-deep undo invariant can't be silently invalidated by
 * a mutation the dispatcher never saw.
 */
export function applyCommand(project: ProjectModel, command: Command): ProjectModel {
  if (command.type === "rounds.set" || command.type === "signOff.set" || command.type === "meta.ai.set") {
    return applyToProject(project, command);
  }
  const step = project.steps[command.stepId];
  const nextStep = applyToStep(step, command);
  return { ...project, steps: { ...project.steps, [command.stepId]: nextStep } };
}
