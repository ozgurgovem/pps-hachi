import type { CellData, MergedRange, RowDef } from "../descriptor";
import type { A3ContentZone, A3TextLine } from "../methodContract";
import type { PendingImageSlot } from "./place";
import { ENTRY_BODY_STYLE_ID, resolveLineStyleId, type ColumnWidth } from "./contentStyle";

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

interface ZoneColumnIndices {
  readonly startIndex: number;
  readonly endIndex: number;
}

/**
 * D-189/P-43 (Kusur 2): a zone assigned less than this share of its own
 * requested width is "stranded" and borrows a column from its widest
 * neighbour — see `widenStrandedZones`.
 */
const MIN_ZONE_WIDTH_RATIO = 0.5;

function widthOfIndices(columnWidths: readonly ColumnWidth[], indices: ZoneColumnIndices): number {
  let sum = 0;
  for (let i = indices.startIndex; i <= indices.endIndex; i += 1) {
    sum += columnWidths[i]!.widthPt;
  }
  return sum;
}

/**
 * Greedily consumes columns until each zone's cumulative width target is
 * reached (D-102's original rule, unchanged) — returns column *indices*
 * rather than keys so `widenStrandedZones` can adjust boundaries before
 * converting to the final `ZoneColumnRange` shape. A zone with no columns
 * left to assign (fractions summing past 1, or more zones than columns) is
 * `undefined` — the caller decides what that means for the entry as a whole
 * (D-107).
 */
function greedyAssignColumnIndices(
  zones: readonly A3ContentZone[],
  columnWidths: readonly ColumnWidth[],
): (ZoneColumnIndices | undefined)[] {
  const totalWidthPt = columnWidths.reduce((sum, column) => sum + column.widthPt, 0);
  const assignments: (ZoneColumnIndices | undefined)[] = [];
  let columnIndex = 0;
  let cumulativeAssignedPt = 0;
  let cumulativeTargetPt = 0;

  for (const zone of zones) {
    cumulativeTargetPt += zone.widthFraction * totalWidthPt;
    if (columnIndex >= columnWidths.length) {
      assignments.push(undefined);
      continue;
    }
    const startIndex = columnIndex;
    do {
      cumulativeAssignedPt += columnWidths[columnIndex]!.widthPt;
      columnIndex += 1;
    } while (columnIndex < columnWidths.length && cumulativeAssignedPt < cumulativeTargetPt);
    assignments.push({ startIndex, endIndex: columnIndex - 1 });
  }

  // Rounding leftover: any columns past the last zone's target absorb into
  // that last *assigned* zone, same as the original algorithm.
  let lastAssignedIndex = -1;
  for (let i = 0; i < assignments.length; i += 1) {
    if (assignments[i]) {
      lastAssignedIndex = i;
    }
  }
  if (lastAssignedIndex >= 0 && columnIndex < columnWidths.length) {
    const last = assignments[lastAssignedIndex]!;
    assignments[lastAssignedIndex] = { startIndex: last.startIndex, endIndex: columnWidths.length - 1 };
  }

  return assignments;
}

/**
 * D-189/P-43 (Kusur 2): `greedyAssignColumnIndices`'s whole-column snapping
 * doesn't weigh column-width evenness — a template's near-zero-width legacy
 * "gutter" column (`farplas-7step-tr`'s D/H/L/O, 8–18 pt) can end up as an
 * entire zone by itself. Chosen fix (Barış, D2b, "Seçenek C"): the
 * assignment algorithm itself is unchanged; a zone assigned less than
 * `MIN_ZONE_WIDTH_RATIO` of its own requested width borrows one column at a
 * time from whichever neighbour is currently wider, stopping once it clears
 * the threshold or no neighbour can give up a column without itself going
 * empty (every zone keeps >= 1 column, D-107's invariant). Verified against
 * both shipped callers: leaves `smart-target`'s three zones (D-38/D-178,
 * LOCKED) completely untouched — none fall under the threshold — while
 * lifting `five-n1k`'s stranded "NEREDE?" zone from 8.25 pt (column O alone)
 * to 246 pt (N:O).
 *
 * Known limitation, accepted rather than engineered around (no case in the
 * shipped registry needs it): zones are widened left-to-right, so a later
 * zone's borrow can — in principle — push an *earlier*, already-checked
 * zone back under its own threshold without a second pass catching it.
 */
function widenStrandedZones(
  zones: readonly A3ContentZone[],
  assignments: readonly ZoneColumnIndices[],
  columnWidths: readonly ColumnWidth[],
  totalWidthPt: number,
): ZoneColumnIndices[] {
  const widened = assignments.map((indices) => ({ ...indices }));
  const columnCount = (indices: ZoneColumnIndices) => indices.endIndex - indices.startIndex + 1;

  widened.forEach((indices, zoneIndex) => {
    const zone = zones[zoneIndex]!;
    const minAcceptablePt = zone.widthFraction * totalWidthPt * MIN_ZONE_WIDTH_RATIO;

    while (widthOfIndices(columnWidths, indices) < minAcceptablePt) {
      const prev = zoneIndex > 0 ? widened[zoneIndex - 1]! : undefined;
      const next = zoneIndex < widened.length - 1 ? widened[zoneIndex + 1]! : undefined;
      const prevCanGive = prev !== undefined && columnCount(prev) > 1;
      const nextCanGive = next !== undefined && columnCount(next) > 1;
      if (!prevCanGive && !nextCanGive) {
        break;
      }

      const prevWidthPt = prevCanGive ? widthOfIndices(columnWidths, prev!) : -1;
      const nextWidthPt = nextCanGive ? widthOfIndices(columnWidths, next!) : -1;

      if (prevWidthPt >= nextWidthPt) {
        prev!.endIndex -= 1;
        indices.startIndex -= 1;
      } else {
        next!.startIndex += 1;
        indices.endIndex += 1;
      }
    }
  });

  return widened;
}

function toColumnRange(columnWidths: readonly ColumnWidth[], indices: ZoneColumnIndices): ZoneColumnRange {
  return {
    firstCol: columnWidths[indices.startIndex]!.key,
    lastCol: columnWidths[indices.endIndex]!.key,
    widthPt: widthOfIndices(columnWidths, indices),
  };
}

/**
 * Snaps each zone's `widthFraction` to whole-column boundaries (Excel merges
 * can't split a column), then widens any zone stranded on a near-zero-width
 * gutter column (D-189/P-43, `widenStrandedZones`). A zone with no columns
 * left to assign is dropped from the output — the caller decides what that
 * means for the entry as a whole.
 */
function splitColumnsIntoZones(
  zones: readonly A3ContentZone[],
  columnWidths: readonly ColumnWidth[],
): readonly ZoneColumnRange[] {
  const totalWidthPt = columnWidths.reduce((sum, column) => sum + column.widthPt, 0);
  const assignments = greedyAssignColumnIndices(zones, columnWidths);

  if (assignments.some((assignment) => assignment === undefined)) {
    return assignments
      .filter((assignment): assignment is ZoneColumnIndices => assignment !== undefined)
      .map((assignment) => toColumnRange(columnWidths, assignment));
  }

  const widened = widenStrandedZones(zones, assignments as ZoneColumnIndices[], columnWidths, totalWidthPt);
  return widened.map((assignment) => toColumnRange(columnWidths, assignment));
}

/**
 * D-189/P-43 (Kusur 1): spreads a zone's line stack across up to `rowsUsed`
 * physical rows instead of always joining every line into one — the Rust
 * writer locks each row's height (`customHeight`, no auto-fit), so a
 * multi-line zone squeezed into one ordinary body row visibly clips past
 * the first line. When a zone's own line count already fits one line per
 * row (`five-n1k`'s typical case, 2 lines / 2 rows), each row gets exactly
 * one line and its own bold/tone styling. When the band is *shorter* than
 * the zone needs (`smart-target`'s single 153.75 pt row, D-38/D-178 LOCKED),
 * multiple lines land in the same row joined by `\n`, reproducing the
 * pre-fix behaviour exactly. A zone needing fewer rows than `rowsUsed`
 * leaves the remaining rows blank (Barış's choice, D2b "Seçenek A" —
 * top-aligned, matching `place.ts`'s own non-zone `lines` path) rather than
 * centering.
 */
function placeZoneLines(
  lines: readonly A3TextLine[],
  range: ZoneColumnRange,
  startRow: number,
  rowsUsed: number,
  cells: CellData[],
  merges: MergedRange[],
): void {
  const linesPerRow = Math.max(1, Math.ceil(lines.length / rowsUsed));

  for (let rowOffset = 0; rowOffset < rowsUsed; rowOffset += 1) {
    const chunk = lines.slice(rowOffset * linesPerRow, (rowOffset + 1) * linesPerRow);
    if (chunk.length === 0) {
      break;
    }

    const row = startRow + rowOffset;
    const ref = `${range.firstCol}${row}`;
    const styleId = chunk.length === 1 ? resolveLineStyleId(chunk[0]!) : ENTRY_BODY_STYLE_ID;
    cells.push({ ref, value: chunk.map((line) => line.text).join("\n"), styleId });
    if (range.firstCol !== range.lastCol) {
      merges.push({ range: `${ref}:${range.lastCol}${row}` });
    }
  }
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

  const availableRows = lastRow - startRow + 1;
  const maxLinesNeeded = Math.max(0, ...zones.map((zone) => zone.lines?.length ?? 0));
  const rowsUsed = maxLinesNeeded === 0 ? 0 : Math.min(maxLinesNeeded, availableRows);

  const cells: CellData[] = [];
  const merges: MergedRange[] = [];
  const pendingImages: PendingImageSlot[] = [];

  zones.forEach((zone, index) => {
    const range = ranges[index];
    if (!range) {
      return;
    }

    if (zone.lines && zone.lines.length > 0 && rowsUsed > 0) {
      placeZoneLines(zone.lines, range, startRow, rowsUsed, cells, merges);
    }

    if (zone.image) {
      pendingImages.push({
        entryId,
        kind: zone.image.kind,
        spec: zone.image.spec,
        anchorCell: `${range.firstCol}${startRow}`,
        widthPt: range.widthPt,
        heightPt: bandHeightPt,
        source: zone.image.source,
        assetImageId: zone.image.assetImageId,
      });
    }
  });

  return { cells, merges, pendingImages };
}
