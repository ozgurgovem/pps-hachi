import { createElement } from "react";
import { REFERENCE_ROLES } from "../../domain/model";
import { emptyFieldFormValues } from "../shared/fieldForm";
import type { GanttChartSpec } from "../chartSpec";
import type { MethodPlugin } from "../types";
import { ActionItemEditor } from "./Editor";
import { ACTION_ITEM_FIELDS } from "./fields";
import { GanttChart } from "./GanttChart";
import { renderActionItemToA3 } from "./renderToA3";
import { ActionItemPayloadSchema, type ActionItemPayload } from "./schema";

export const ACTION_ITEM_METHOD_ID = "action-item";

/**
 * P-22/D-270: rows the block-level Gantt reserves at the top of Step 6's
 * block, before any action's own text row — the same conservative sizing
 * `kpiStrip`'s own `CHART_ROW_SPAN` (D-182/P-63) already chose against
 * `pps-8step-auto`'s tighter elastic canvases.
 */
const GANTT_ROW_SPAN = 6;

function buildActionItemGanttSpec(
  entries: readonly { readonly id: string; readonly title: string; readonly payload: ActionItemPayload }[],
): GanttChartSpec {
  return {
    kind: "gantt-chart",
    items: entries.map(({ id, title, payload }) => ({
      id,
      label: payload.action.trim() || title,
      startDate: payload.startDate,
      dueDate: payload.dueDate,
    })),
  };
}

export const actionItemMethod: MethodPlugin<ActionItemPayload> = {
  id: ACTION_ITEM_METHOD_ID,
  steps: [6],
  tier: "recommended",
  nameKey: "methods.actionItem.name",
  useWhenKey: "methods.actionItem.useWhen",
  schema: ActionItemPayloadSchema,
  Editor: ActionItemEditor,
  createEmptyPayload: () => emptyFieldFormValues(ACTION_ITEM_FIELDS),
  renderToA3: renderActionItemToA3,
  /** SPEC.md §4.2: "an action holds `countermeasureId`" — singular. */
  referenceRoles: [
    {
      role: REFERENCE_ROLES.countermeasure,
      labelKey: "methods.actionItem.references.countermeasure.label",
      emptyKey: "methods.actionItem.references.countermeasure.empty",
      fromSteps: [5],
      multiple: false,
    },
  ],
  aiProposal: { promptVersion: "v1" },
  /**
   * P-22/D-270: this plugin's own `renderToA3` never requests a per-entry
   * `image` — `imageKind`/`renderImage` here exist purely so
   * `getA3ImageRendererMap()` (D-102's existing rasterize-dispatch
   * mechanism) knows how to draw `"action-gantt-chart"` pixels, reused
   * as-is by the new, unrelated block-aggregate mechanism below.
   */
  imageKind: "action-gantt-chart",
  renderImage: (spec, size) => createElement(GanttChart, { spec: spec as GanttChartSpec, size }),
  blockAggregateImage: {
    kind: "action-gantt-chart",
    rowSpan: GANTT_ROW_SPAN,
    buildSpec: buildActionItemGanttSpec,
  },
};
