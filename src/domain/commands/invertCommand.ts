import type { Command } from "./types";

/**
 * Returns the command that undoes `command`. D-70: undo/redo never touch
 * `ProjectModel` directly — `undo` applies `invertCommand(top of stack)`,
 * `redo` re-applies the original.
 */
export function invertCommand(command: Command): Command {
  switch (command.type) {
    case "entry.insert":
      return { ...command, type: "entry.remove" };
    case "entry.remove":
      return { ...command, type: "entry.insert" };
    case "entry.update":
      return { ...command, before: command.after, after: command.before };
    case "entry.setA3Visibility":
      return { ...command, before: command.after, after: command.before };
    case "entries.reorder":
      return { ...command, before: command.after, after: command.before };
    case "rounds.set":
      return { ...command, before: command.after, after: command.before };
    case "signOff.set":
      return { ...command, before: command.after, after: command.before };
    case "meta.ai.set":
      return { ...command, before: command.after, after: command.before };
    case "meta.projectInfo.set":
      return { ...command, before: command.after, after: command.before };
    case "templateId.set":
      return { ...command, before: command.after, after: command.before };
  }
}
