import type { ElasticBlockGeometry } from "../descriptor";

/**
 * Faz 11/L3b (D-170/D-226/D-227) introduced the idea of ".elastic blocks that
 * share one physical column" — `BlockPinOverlay`'s drag handles need it to
 * find the boundary between two adjacent blocks. P-64 (a column's LAST block
 * has no drag handle of its own, since there is no boundary below it) needed
 * the exact same grouping a second time for `PinnedBlockSummary`'s manual
 * numeric-entry control, so it is extracted here rather than duplicated
 * (this project's own "extract before the second use" discipline — D-127).
 *
 * A "column" is identified by its `contentColumns` range, not by array
 * position — two blocks share a column iff they occupy the same
 * `first:last` column span, regardless of where they sit in
 * `descriptor.elasticBlocks`. Within a column, array order is treated as
 * top-to-bottom visual order (the same assumption `BlockPinOverlay` already
 * makes for its own handles) — `resolveElasticBlocks` emits a template's
 * blocks in that order.
 */
export function columnGroupKey(block: ElasticBlockGeometry): string {
  return `${block.contentColumns.first}:${block.contentColumns.last}`;
}

export function canvasRowsOf(block: ElasticBlockGeometry): number {
  return block.contentRows.end - block.contentRows.start + 1;
}

export function groupElasticBlocksByColumn(
  blocks: readonly ElasticBlockGeometry[],
): ElasticBlockGeometry[][] {
  const groups = new Map<string, ElasticBlockGeometry[]>();
  for (const block of blocks) {
    const key = columnGroupKey(block);
    const list = groups.get(key) ?? [];
    list.push(block);
    groups.set(key, list);
  }
  return [...groups.values()];
}

/**
 * The one block per column `BlockPinOverlay` never gives a drag handle to —
 * P-64's own scope. Each entry is the bottommost block of its own column.
 */
export function lastBlockOfEachColumn(
  blocks: readonly ElasticBlockGeometry[],
): ElasticBlockGeometry[] {
  return groupElasticBlocksByColumn(blocks)
    .map((column) => column[column.length - 1])
    .filter((block): block is ElasticBlockGeometry => block !== undefined);
}
