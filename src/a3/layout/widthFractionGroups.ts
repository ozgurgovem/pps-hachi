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

/** Segments `items` (in their given, already-placement order) into runs per the rule above. Pure — no layout math, just grouping. */
export function groupIntoRuns<T>(items: readonly T[], contentOf: (item: T) => A3BlockContent): readonly EntryRun<T>[] {
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
