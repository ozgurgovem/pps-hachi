import { buildA3Layout } from "../../../a3/buildA3Layout";
import { getTemplateById } from "../../../a3/templates/registry";
import type { ProjectModel, StepId } from "../../../domain/model";
import { getA3RendererMap } from "../../../methods/registry";
import { buildEntryLookup } from "../workspace/layoutReview";

export interface TemplateSwitchDroppedEntry {
  readonly entryId: string;
  readonly title: string;
  readonly stepId: StepId;
}

export interface TemplateSwitchPreview {
  readonly droppedEntries: readonly TemplateSwitchDroppedEntry[];
}

/**
 * Faz 11/L2 §3.1: a pure, side-effect-free dry run of what switching
 * `project` to `targetTemplateId` would do to its entries. Reuses
 * `buildA3Layout`'s own D-100 mechanism — an entry that no longer fits its
 * target block's budget already comes back inside `descriptor.
 * overflowWarnings[].droppedEntryIds`, so this never re-implements "does
 * this entry fit," it only reads the answer. Only the first (pure)
 * `buildA3Layout` call is needed — D-102's second, rasterizing pass exists
 * to produce pixels for an actual export/preview render, and this dry run
 * only needs geometry, never pixels.
 */
export function previewTemplateSwitch(project: ProjectModel, targetTemplateId: string): TemplateSwitchPreview {
  const targetTemplate = getTemplateById(targetTemplateId);
  const rendererMap = getA3RendererMap();
  const { descriptor } = buildA3Layout(project, targetTemplate, { rendererMap });
  const lookup = buildEntryLookup(project);

  const droppedIds = new Set<string>();
  for (const warning of descriptor.overflowWarnings) {
    for (const id of warning.droppedEntryIds) {
      droppedIds.add(id);
    }
  }

  const droppedEntries: TemplateSwitchDroppedEntry[] = [];
  for (const id of droppedIds) {
    const found = lookup.get(id);
    if (found) {
      droppedEntries.push({ entryId: id, title: found.entry.title, stepId: found.stepId });
    }
  }

  return { droppedEntries };
}
