import type { A3BlockContent } from "../methodContract";

/**
 * One run of a block's own entry order: either a single entry that stands
 * alone (the Phase 4 default — stacked full block width), or two or more
 * CONSECUTIVE entries that all declared `A3BlockContent.widthFraction`
 * (ADIM 1 side-by-side round, 2026-09-17) and should share the block's
 * width instead of stacking. `place.ts` (real placement) and
 * `elasticAllocation.ts` (row-demand estimation) both need the exact same
 * segmentation — factored here once (G2) so the two can never silently
 * disagree about which entries form a group.
 *
 * A lone `widthFraction` entry with no sibling declaring one right next to
 * it is `sideBySide: false` — a "group" of one is functionally the
 * ungrouped case (full block width), so a project that removes one of two
 * side-by-side entries doesn't leave the survivor stranded in half the
 * block. A `zones` entry (D-102) is never grouped, even if it also happens
 * to set `widthFraction` — the two mechanisms solve the same "more than
 * one thing across the block's width" problem at different granularities
 * and are not meant to compose (`A3BlockContent.widthFraction`'s own doc
 * comment).
 */
export interface EntryRun<T> {
  readonly items: readonly T[];
  readonly sideBySide: boolean;
}

function isSideBySide(content: A3BlockContent): boolean {
  return content.widthFraction !== undefined && content.zones === undefined;
}

/**
 * Narrowest a horizontally-laid-out entry may get before the block wraps it
 * onto another row. At the printed-10pt floor (`src/a3/readability.ts`) a
 * column this wide holds roughly twenty characters — below that, "laid out
 * horizontally" stops being a layout and starts being a way to make
 * everything unreadable.
 */
export const MIN_HORIZONTAL_ENTRY_WIDTH_PT = 120;

/**
 * How many entries a block of this width can put beside each other before
 * they stop being readable. Always at least one.
 */
export function horizontalRunCapacity(blockWidthPt: number): number {
  return Math.max(1, Math.floor(blockWidthPt / MIN_HORIZONTAL_ENTRY_WIDTH_PT));
}

/**
 * Splits `count` entries into rows that are as even as possible, none wider
 * than `capacity`. Four entries in a block that fits four across go 4; in
 * one that fits three they go 2+2 rather than 3+1, because a lone entry on
 * its own row is the full-width letterboxing this layout exists to avoid.
 */
function evenRowSizes(count: number, capacity: number): number[] {
  const rows = Math.ceil(count / capacity);
  const base = Math.floor(count / rows);
  const remainder = count % rows;
  return Array.from({ length: rows }, (_unused, index) => base + (index < remainder ? 1 : 0));
}

/** Segments `items` (in their given, already-placement order) into runs per the rule above. Pure — no layout math, just grouping. */
export function groupIntoRuns<T>(
  items: readonly T[],
  contentOf: (item: T) => A3BlockContent,
  /**
   * Set for a block whose own `entryLayout` is `"horizontal"`: every entry
   * joins a side-by-side row regardless of what its method declared, and
   * rows wrap at this many entries.
   */
  horizontalCapacity?: number,
): readonly EntryRun<T>[] {
  if (horizontalCapacity !== undefined && items.length > 0) {
    // A `zones` entry still stands alone — zones already partition the
    // block's width themselves, and the two mechanisms are not meant to
    // compose (`A3BlockContent.widthFraction`'s own doc comment).
    const runs: EntryRun<T>[] = [];
    let index = 0;
    while (index < items.length) {
      if (contentOf(items[index]!).zones !== undefined) {
        runs.push({ items: [items[index]!], sideBySide: false });
        index += 1;
        continue;
      }
      const stretch: T[] = [];
      while (index < items.length && contentOf(items[index]!).zones === undefined) {
        stretch.push(items[index]!);
        index += 1;
      }
      for (const size of evenRowSizes(stretch.length, Math.max(1, horizontalCapacity))) {
        const row = stretch.splice(0, size);
        runs.push({ items: row, sideBySide: row.length > 1 });
      }
    }
    return runs;
  }

  return groupByDeclaredWidthFraction(items, contentOf);
}

function groupByDeclaredWidthFraction<T>(
  items: readonly T[],
  contentOf: (item: T) => A3BlockContent,
): readonly EntryRun<T>[] {
  const runs: EntryRun<T>[] = [];
  let index = 0;

  while (index < items.length) {
    if (isSideBySide(contentOf(items[index]!))) {
      const group: T[] = [];
      while (index < items.length && isSideBySide(contentOf(items[index]!))) {
        group.push(items[index]!);
        index += 1;
      }
      runs.push({ items: group, sideBySide: group.length > 1 });
      continue;
    }

    runs.push({ items: [items[index]!], sideBySide: false });
    index += 1;
  }

  return runs;
}
