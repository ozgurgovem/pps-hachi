import type { Entry, ProjectModel } from "../../domain/model";
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
 */
function distributeElasticColumn(members: readonly ElasticMember[]): readonly number[] {
  const natural = members.map((member) => clamp(member.demandRows, member.minimumRows, member.defaultRows));
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

  return members.map((member, index) => member.defaultRows - shrink[index]! + grow[index]!);
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
 */
export function resolveElasticBlocks(
  template: A3Template,
  allEntries: readonly EntryWithStep[],
  rendererMap: A3EntryRendererMap,
  language: ProjectModel["meta"]["language"],
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
      return { defaultRows, minimumRows: block.elastic!.minimumCanvasRows, demandRows };
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
