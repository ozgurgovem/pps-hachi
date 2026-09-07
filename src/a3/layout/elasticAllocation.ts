import type { Entry, ProjectModel, StepId } from "../../domain/model";
import { parseRange } from "../cellRef";
import { resolveEntryContent, type A3EntryRendererMap } from "../methodContract";
import type { A3Template, TemplateBlock } from "../templates/types";
import { entriesForBlock, columnWidthsInRange, type EntryWithStep } from "./entriesByBlock";
import { ENTRY_CONTENT_FONT_PT, type ColumnWidth } from "./contentStyle";
import { estimateCharsPerLine, wrapText } from "./measure";

/**
 * Faz 11/L3a (D-158/D-160, both LOCKED): how many canvas rows this block's
 * entries would need if the block's budget were unlimited — the "demand"
 * side of the elastic solver, deliberately its own pure function rather than
 * a mode bolted onto `placeBlockContent` (kept that function, and D-102's
 * two-call rasterization pattern it participates in, untouched).
 *
 * Mirrors `placeBlockContent`'s own row-counting for `lines`/`image` content
 * exactly (same wrap width, same one-wrapped-line-per-row rule) so the
 * solver's estimate and the later real placement never silently disagree.
 * `zones` content with no `zonesRowSpan`, or an `image` with no `rowSpan`,
 * both mean "fills whatever remains" (D-224/Phase 5's own fallback,
 * `fishbone`/`smartTarget`'s own doc comments) — there is no finite natural
 * size to report, so the demand is `Number.POSITIVE_INFINITY`: this block
 * always wants the rest of its column, exactly like it does today under the
 * static budget.
 */
export function estimateBlockRowDemand(
  entries: readonly Entry[],
  contentColumnWidths: readonly ColumnWidth[],
  rendererMap: A3EntryRendererMap,
  language: ProjectModel["meta"]["language"],
): number {
  const blockWidthPt = contentColumnWidths.reduce((sum, column) => sum + column.widthPt, 0);
  const maxCharsPerLine = estimateCharsPerLine(blockWidthPt, ENTRY_CONTENT_FONT_PT);

  let total = 0;
  for (const entry of entries) {
    const content = resolveEntryContent(
      entry.methodId,
      entry.payload,
      { id: entry.id, title: entry.title, language, images: entry.images },
      rendererMap,
    );

    if (content.zones) {
      if (content.zonesRowSpan === undefined) {
        return Number.POSITIVE_INFINITY;
      }
      total += content.zonesRowSpan;
      continue;
    }

    const lineCount = content.lines.reduce(
      (sum, line) => sum + wrapText(line.text, maxCharsPerLine).length,
      0,
    );

    if (content.image) {
      if (content.image.rowSpan === undefined) {
        return Number.POSITIVE_INFINITY;
      }
      total += lineCount + content.image.rowSpan;
      continue;
    }

    total += lineCount;
  }
  return total;
}

interface ElasticMember {
  readonly defaultRows: number;
  readonly minimumRows: number;
  readonly demandRows: number;
  /**
   * Faz 11/L3b (D-170): a manual override — when present, this member's
   * final row count is fixed (floor-clamped, see `distributeElasticColumn`)
   * rather than computed from `demandRows`. The remaining, non-pinned
   * members of the column are then re-solved by the same demand-based
   * arithmetic against whatever total the pin(s) leave behind.
   */
  readonly pinnedRows?: number;
}

/**
 * D-160's own arithmetic, spelled out: each block rests at
 * `clamp(demand, minimum, default)` — never grown past its own default here,
 * never dropped below its floor. Whatever total is freed by blocks resting
 * below their default (`giveable`) is handed to blocks whose demand exceeds
 * their default (`wanted`), in column order, capped by both sides — so a
 * column's row total is invariant (`sum(default) - sum(shrink) + sum(grow)`,
 * and `sum(shrink) === sum(grow)` by construction) regardless of how content
 * is distributed. A block with `Number.POSITIVE_INFINITY` demand always
 * absorbs whatever surplus is left once it's reached in column order.
 *
 * Same demand-based redistribution, generalized to target an arbitrary
 * `targetTotal` instead of always `sum(defaultRows)` — needed so a pinned
 * neighbour's fixed row count (which may itself differ from ITS OWN
 * default) can shrink or grow the pool the remaining members redistribute
 * without disturbing the column's true, physically-fixed total. When
 * `targetTotal === sum(defaultRows)` (every existing call site before
 * D-170, and `distributeElasticColumn`'s own no-pin branch), `delta` is
 * always 0 and this reproduces the original algorithm byte-for-byte.
 */
function solveGroup(members: readonly ElasticMember[], targetTotal: number): readonly number[] {
  if (members.length === 0) {
    return [];
  }

  const natural = members.map((member) => clamp(member.demandRows, member.minimumRows, member.defaultRows));
  const defaultTotal = members.reduce((sum, member) => sum + member.defaultRows, 0);
  const giveable = members.map((member, index) => member.defaultRows - natural[index]!);
  const wanted = members.map((member) =>
    member.demandRows === Number.POSITIVE_INFINITY
      ? Number.POSITIVE_INFINITY
      : Math.max(0, member.demandRows - member.defaultRows),
  );

  const totalGiveable = giveable.reduce((sum, value) => sum + value, 0);
  const totalWanted = wanted.reduce((sum, value) => sum + value, 0);
  const toRedistribute = Number.isFinite(totalWanted) ? Math.min(totalGiveable, totalWanted) : totalGiveable;

  const shrink = members.map(() => 0);
  let remainingToTake = toRedistribute;
  for (let index = 0; index < members.length && remainingToTake > 0; index += 1) {
    const take = Math.min(giveable[index]!, remainingToTake);
    shrink[index] = take;
    remainingToTake -= take;
  }

  const grow = members.map(() => 0);
  let remainingToGive = toRedistribute;
  for (let index = 0; index < members.length && remainingToGive > 0; index += 1) {
    const want = wanted[index]!;
    if (want <= 0) {
      continue;
    }
    const give = Number.isFinite(want) ? Math.min(want, remainingToGive) : remainingToGive;
    grow[index] = give;
    remainingToGive -= give;
  }

  const provisional = members.map((member, index) => member.defaultRows - shrink[index]! + grow[index]!);

  const delta = targetTotal - defaultTotal;
  if (delta === 0) {
    return provisional;
  }

  const result = [...provisional];
  if (delta > 0) {
    // Extra budget beyond what pure demand-based redistribution already
    // granted (freed by a pinned neighbour shrinking below its own
    // default) — hand it to whichever member still has unmet demand, in
    // declaration order; if nobody wants it, it still has to belong to
    // some block's canvas, so it lands on the column's last member.
    let remaining = delta;
    for (let index = 0; index < members.length && remaining > 0; index += 1) {
      const unmet = wanted[index]! === Number.POSITIVE_INFINITY ? Number.POSITIVE_INFINITY : wanted[index]! - grow[index]!;
      if (unmet <= 0) {
        continue;
      }
      const give = Number.isFinite(unmet) ? Math.min(unmet, remaining) : remaining;
      result[index]! += give;
      remaining -= give;
    }
    if (remaining > 0) {
      result[result.length - 1]! += remaining;
    }
  } else {
    // A pinned neighbour grew beyond its own default, consuming from this
    // group's pool — take the shortfall from members with slack above
    // their own floor, in declaration order. Always feasible: the caller
    // (`distributeElasticColumn`) never lets a pin's growth push this
    // group's target below the sum of its own members' floors.
    let remaining = -delta;
    for (let index = 0; index < members.length && remaining > 0; index += 1) {
      const slack = provisional[index]! - members[index]!.minimumRows;
      if (slack <= 0) {
        continue;
      }
      const take = Math.min(slack, remaining);
      result[index]! -= take;
      remaining -= take;
    }
  }
  return result;
}

/**
 * Faz 11/L3b (D-170): partitions `members` into pinned and non-pinned, caps
 * each pin so every non-pinned member can still reach its own floor
 * (`minimumCanvasRows` is an iron law — D-160, LOCKED — a pin can never
 * violate it, however large the request), then re-solves the non-pinned
 * remainder via `solveGroup` against whatever total the pins leave behind.
 * With no pinned members at all, this is exactly the pre-D-170 algorithm
 * (`solveGroup(members, sum(defaultRows))`), so every call site that never
 * passes a pin reproduces its old output byte-for-byte.
 */
function distributeElasticColumn(members: readonly ElasticMember[]): readonly number[] {
  const columnTotal = members.reduce((sum, member) => sum + member.defaultRows, 0);
  const pinnedIndices: number[] = [];
  const nonPinnedIndices: number[] = [];
  members.forEach((member, index) => {
    (member.pinnedRows === undefined ? nonPinnedIndices : pinnedIndices).push(index);
  });

  if (pinnedIndices.length === 0) {
    return solveGroup(members, columnTotal);
  }

  const nonPinnedFloorSum = nonPinnedIndices.reduce((sum, index) => sum + members[index]!.minimumRows, 0);
  let remainingPinBudget = columnTotal - nonPinnedFloorSum;
  const pinnedActual = new Map<number, number>();
  for (const index of pinnedIndices) {
    const member = members[index]!;
    const requested = Math.max(member.pinnedRows!, member.minimumRows);
    const actual = Math.max(member.minimumRows, Math.min(requested, remainingPinBudget));
    pinnedActual.set(index, actual);
    remainingPinBudget -= actual;
  }

  const pinnedTotal = [...pinnedActual.values()].reduce((sum, value) => sum + value, 0);
  const remainingTotal = columnTotal - pinnedTotal;
  const nonPinnedMembers = nonPinnedIndices.map((index) => members[index]!);
  const nonPinnedRows = solveGroup(nonPinnedMembers, remainingTotal);

  const result = new Array<number>(members.length);
  pinnedIndices.forEach((index) => {
    result[index] = pinnedActual.get(index)!;
  });
  nonPinnedIndices.forEach((index, memberIndex) => {
    result[index] = nonPinnedRows[memberIndex]!;
  });
  return result;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function columnGroupKey(block: TemplateBlock): string {
  return `${block.contentColumns.first}:${block.contentColumns.last}`;
}

/**
 * Faz 11/L3a: returns `template.blocks` with every `.elastic`-declared
 * block's `headerRange`/`contentRows` recomputed for this specific project,
 * per D-158's column-level solver. A block that never declares `.elastic`
 * (every `farplas-7step-tr` block, D-223 madde 1's own scope call) passes
 * through completely unchanged — this function is template-agnostic, not
 * `pps-8step-auto`-specific, so a template opts in per block rather than
 * this module branching on `template.id`.
 *
 * Column membership is read from `contentColumns` (blocks sharing the same
 * first/last column key are column-mates); their column-band row total is
 * fixed at the sum of their own `contentRows` defaults, so this can never
 * grow or shrink the column as a whole, only redistribute rows within it.
 * Blocks are assumed to appear in `template.blocks` in top-to-bottom order
 * within their column (true for `pps-8step-auto`'s own declaration order) —
 * `resolveElasticBlocks.test.ts` pins the exact resulting geometry against
 * the shipped defaults to catch a future reordering that would break this.
 *
 * `pinnedCanvasRowsByStepId` (Faz 11/L3b, D-170) is a pure, optional 5th
 * parameter — `resolveElasticBlocks` stays free of any dependency on
 * `ProjectModel.blockPins` itself (D-03/D-04's purity contract, Barış's own
 * choice via `AskUserQuestion`); `buildA3Layout.ts` is the one place that
 * reads `project.blockPins` and translates it into this map. Keyed by
 * `StepId` rather than block index because every `pps-8step-auto` block is
 * 1:1 with a single app-step (D-224) — a stable, template-agnostic key that
 * survives a future template reordering its own `blocks` array. A block
 * whose own `appSteps[0]` has no entry in the map (including every
 * `farplas-7step-tr` block, and any project with no pins at all) resolves
 * exactly as it did before D-170.
 */
export function resolveElasticBlocks(
  template: A3Template,
  allEntries: readonly EntryWithStep[],
  rendererMap: A3EntryRendererMap,
  language: ProjectModel["meta"]["language"],
  pinnedCanvasRowsByStepId?: ReadonlyMap<StepId, number>,
): readonly TemplateBlock[] {
  const groups = new Map<string, number[]>();
  template.blocks.forEach((block, index) => {
    if (!block.elastic) {
      return;
    }
    const key = columnGroupKey(block);
    const indices = groups.get(key) ?? [];
    indices.push(index);
    groups.set(key, indices);
  });

  const resolvedRanges = new Map<number, { readonly headerRange: string; readonly contentRows: { start: number; end: number } }>();

  for (const indices of groups.values()) {
    const members: ElasticMember[] = indices.map((index) => {
      const block = template.blocks[index]!;
      const defaultRows = block.contentRows.end - block.contentRows.start + 1;
      const blockEntries = entriesForBlock(allEntries, block);
      const contentColumnWidths = columnWidthsInRange(
        template,
        block.contentColumns.first,
        block.contentColumns.last,
      );
      const demandRows = estimateBlockRowDemand(blockEntries, contentColumnWidths, rendererMap, language);
      const stepId = block.appSteps[0];
      const pinnedRows = stepId === undefined ? undefined : pinnedCanvasRowsByStepId?.get(stepId);
      return {
        defaultRows,
        minimumRows: block.elastic!.minimumCanvasRows,
        demandRows,
        ...(pinnedRows === undefined ? undefined : { pinnedRows }),
      };
    });

    const rowCounts = distributeElasticColumn(members);

    let cursorRow = parseRange(template.blocks[indices[0]!]!.headerRange).start.row;
    indices.forEach((index, memberIndex) => {
      const block = template.blocks[index]!;
      const header = parseRange(block.headerRange);
      const headerSpan = header.end.row - header.start.row + 1;
      const headerStartRow = cursorRow;
      const headerEndRow = headerStartRow + headerSpan - 1;
      const contentStartRow = headerEndRow + 1;
      const contentEndRow = contentStartRow + rowCounts[memberIndex]! - 1;

      resolvedRanges.set(index, {
        headerRange: `${block.contentColumns.first}${headerStartRow}:${block.contentColumns.last}${headerEndRow}`,
        contentRows: { start: contentStartRow, end: contentEndRow },
      });

      cursorRow = contentEndRow + 1;
    });
  }

  return template.blocks.map((block, index) => {
    const resolved = resolvedRanges.get(index);
    if (!resolved) {
      return block;
    }
    return { ...block, headerRange: resolved.headerRange, contentRows: resolved.contentRows };
  });
}
