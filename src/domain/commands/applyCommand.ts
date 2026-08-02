import type { Entry, ProjectModel, StepState } from "../model";
import { CommandPreconditionError, type Command } from "./types";

/** D-71: array position is authoritative; every mutation ends by re-sequencing `order` to match it. */
function resequence(entries: Entry[]): Entry[] {
  return entries.map((entry, index) => (entry.order === index ? entry : { ...entry, order: index }));
}

function sameIdSet(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every((id) => setA.has(id));
}

function applyToStep(step: StepState, command: Command): StepState {
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
 * D-70: the one function allowed to mutate `ProjectModel`. Every store
 * action, undo and redo routes through this — never a direct `set()` on
 * `steps`, so the 100-deep undo invariant can't be silently invalidated by
 * a mutation the dispatcher never saw.
 */
export function applyCommand(project: ProjectModel, command: Command): ProjectModel {
  const step = project.steps[command.stepId];
  const nextStep = applyToStep(step, command);
  return { ...project, steps: { ...project.steps, [command.stepId]: nextStep } };
}
