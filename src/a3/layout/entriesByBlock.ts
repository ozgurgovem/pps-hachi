import { STEP_IDS, type Entry, type ProjectModel, type StepId } from "../../domain/model";
import { excelColumnWidthToPt } from "./measure";
import type { ColumnWidth } from "./contentStyle";
import type { A3Template, TemplateBlock } from "../templates/types";
import type { RowDef } from "../descriptor";

/**
 * Faz 11/L3a: pulled out of `buildA3Layout.ts` (unchanged behavior) so
 * `elasticAllocation.ts`'s row-demand solver can share the exact same
 * "which entries land in this block, in what order, at what width" logic
 * `buildA3Layout` itself uses to actually place them — two independent
 * readings of the same project would be a G2 violation and a real risk of
 * the solver's demand estimate silently drifting from what placement later
 * does with it.
 */
export interface EntryWithStep {
  readonly entry: Entry;
  readonly stepId: StepId;
}

export function flattenEntries(project: ProjectModel): readonly EntryWithStep[] {
  const result: EntryWithStep[] = [];
  for (const stepId of STEP_IDS) {
    const step = project.steps[stepId];
    if (!step) {
      continue;
    }
    for (const entry of step.entries) {
      result.push({ entry, stepId });
    }
  }
  return result;
}

export function entriesForBlock(all: readonly EntryWithStep[], block: TemplateBlock): readonly Entry[] {
  return all
    .filter(({ entry, stepId }) => block.appSteps.includes(stepId) && entry.a3Visibility === "primary")
    .sort((a, b) => a.entry.order - b.entry.order)
    .map(({ entry }) => entry);
}

export function columnWidthsInRange(
  template: A3Template,
  firstKey: string,
  lastKey: string,
): readonly ColumnWidth[] {
  const firstIndex = template.columns.findIndex((column) => column.key === firstKey);
  const lastIndex = template.columns.findIndex((column) => column.key === lastKey);
  return template.columns.slice(firstIndex, lastIndex + 1).map((column) => ({
    key: column.key,
    widthPt: excelColumnWidthToPt(column.charWidth),
  }));
}

export function rowsInBlockRange(template: A3Template, block: TemplateBlock): readonly RowDef[] {
  return template.rows.filter(
    (row) => row.index >= block.contentRows.start && row.index <= block.contentRows.end,
  );
}
