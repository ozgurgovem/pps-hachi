import type { CellData, MergedRange, RowDef } from "../descriptor";
import type { A3ContentZone } from "../methodContract";
import type { PendingImageSlot } from "./place";
import { ENTRY_BODY_STYLE_ID, type ColumnWidth } from "./contentStyle";

export interface PlacedZones {
  readonly cells: readonly CellData[];
  readonly merges: readonly MergedRange[];
  readonly pendingImages: readonly PendingImageSlot[];
}

interface ZoneColumnRange {
  readonly firstCol: string;
  readonly lastCol: string;
  readonly widthPt: number;
}

/**
 * Snaps each zone's `widthFraction` to whole-column boundaries (Excel merges
 * can't split a column) by greedily consuming columns until each zone's
 * cumulative width target is reached. The last zone absorbs any leftover
 * columns from rounding, so every column is always assigned to exactly one
 * zone. A zone with no columns left to assign (fractions summing past 1, or
 * more zones than columns) is dropped from the output — the caller decides
 * what that means for the entry as a whole.
 */
function splitColumnsIntoZones(
  zones: readonly A3ContentZone[],
  columnWidths: readonly ColumnWidth[],
): readonly ZoneColumnRange[] {
  const totalWidthPt = columnWidths.reduce((sum, column) => sum + column.widthPt, 0);
  const ranges: ZoneColumnRange[] = [];
  let columnIndex = 0;
  let cumulativeAssignedPt = 0;
  let cumulativeTargetPt = 0;

  for (const zone of zones) {
    cumulativeTargetPt += zone.widthFraction * totalWidthPt;
    if (columnIndex >= columnWidths.length) {
      continue;
    }
    const firstColumnIndex = columnIndex;
    let assignedWidthPt = 0;
    do {
      const column = columnWidths[columnIndex]!;
      assignedWidthPt += column.widthPt;
      cumulativeAssignedPt += column.widthPt;
      columnIndex += 1;
    } while (columnIndex < columnWidths.length && cumulativeAssignedPt < cumulativeTargetPt);

    ranges.push({
      firstCol: columnWidths[firstColumnIndex]!.key,
      lastCol: columnWidths[columnIndex - 1]!.key,
      widthPt: assignedWidthPt,
    });
  }

  const lastRange = ranges[ranges.length - 1];
  if (lastRange && columnIndex < columnWidths.length) {
    let extraWidthPt = 0;
    for (; columnIndex < columnWidths.length; columnIndex += 1) {
      extraWidthPt += columnWidths[columnIndex]!.widthPt;
    }
    ranges[ranges.length - 1] = {
      firstCol: lastRange.firstCol,
      lastCol: columnWidths[columnWidths.length - 1]!.key,
      widthPt: lastRange.widthPt + extraWidthPt,
    };
  }

  return ranges;
}

/**
 * D-102: lays `zones` out horizontally across one reserved row-span (Step
 * 3's D-38 three-zone strip is the forcing case, but this is generic — any
 * method's `renderToA3` can request it). Consumes every row from `startRow`
 * to `lastRow` as a single horizontal band; returns `undefined` if no rows
 * remain (the caller drops the whole entry, same D-100 rule as text/image
 * overflow).
 */
export function placeZonesContent(
  entryId: string,
  zones: readonly A3ContentZone[],
  startRow: number,
  lastRow: number,
  contentRows: readonly RowDef[],
  columnWidths: readonly ColumnWidth[],
): PlacedZones | undefined {
  if (startRow > lastRow || zones.length === 0) {
    return undefined;
  }

  const bandHeightPt = contentRows
    .filter((row) => row.index >= startRow && row.index <= lastRow)
    .reduce((sum, row) => sum + row.heightPt, 0);
  const ranges = splitColumnsIntoZones(zones, columnWidths);

  // Every zone must get at least one column. Fewer columns than zones used
  // to make the surplus zones' text and charts disappear from the sheet
  // with no dropped id and no overflow warning — the exact silent-truncation
  // SPEC.md §2.3 forbids. Refusing here routes the whole entry to an
  // appendix instead (D-100), the same as any other content that won't fit.
  if (ranges.length < zones.length) {
    return undefined;
  }

  const cells: CellData[] = [];
  const merges: MergedRange[] = [];
  const pendingImages: PendingImageSlot[] = [];

  zones.forEach((zone, index) => {
    const range = ranges[index];
    if (!range) {
      return;
    }

    if (zone.lines && zone.lines.length > 0) {
      const ref = `${range.firstCol}${startRow}`;
      cells.push({
        ref,
        value: zone.lines.map((line) => line.text).join("\n"),
        styleId: ENTRY_BODY_STYLE_ID,
      });
      if (range.firstCol !== range.lastCol) {
        merges.push({ range: `${ref}:${range.lastCol}${startRow}` });
      }
    }

    if (zone.image) {
      pendingImages.push({
        entryId,
        kind: zone.image.kind,
        spec: zone.image.spec,
        anchorCell: `${range.firstCol}${startRow}`,
        widthPt: range.widthPt,
        heightPt: bandHeightPt,
      });
    }
  });

  return { cells, merges, pendingImages };
}
