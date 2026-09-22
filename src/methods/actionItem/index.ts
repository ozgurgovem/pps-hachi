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
 * block, before any action's own text row.
 *
 * Recalibrated 2026-09-22 from 6 to 4, against Rev00's real ADIM 6 canvas
 * (4 rows). At 6 the block's total demand — chart plus two actions' five
 * text rows each — exceeded even the whole right column's borrowable
 * surplus by exactly one row, so a second action silently landed in an
 * appendix and lost its bar on the chart. Unlike a per-entry image this is
 * a BLOCK-LEVEL reservation made by `buildA3Layout` itself, so it cannot
 * use `maxDemandRowSpan`'s self-bounding trick the way `kpiStrip` now does
 * (P-63); a value matched to the real canvas is the honest fix available
 * here. Making block-aggregate reservations elastic too is worth doing, but
 * it is a mechanism change, not a constant.
 */
const GANTT_ROW_SPAN = 4;

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
