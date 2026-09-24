import type { A3BlockContent } from "../methodContract";
import { estimateCharsPerLine, wrapText } from "./measure";

/**
 * How many of a block's content rows one entry's content wants, if nothing
 * were competing with it.
 *
 * Extracted 2026-09-23 from `elasticAllocation.ts`, where it was private,
 * because `place.ts` now needs the same answer: the elastic solver asks it
 * to size a BLOCK, and real placement asks it to share that block's rows
 * between the entries inside it. Those two must never disagree about what a
 * given entry wants — `elasticAllocation.ts`'s own doc comment already
 * warned about exactly that drift, so the second caller made this a shared
 * function rather than a second copy (Anayasa Madde 2).
 *
 * `Number.POSITIVE_INFINITY` means "no natural size — give me whatever is
 * left" (`fishbone`/`smartTarget`, D-224/Phase 5's own fallback). A declared
 * `maxDemandRowSpan` turns that into a finite ceiling: past it, more room
 * stops helping.
 */
export function entryRowDemand(
  content: A3BlockContent,
  widthPt: number,
  bodyFontPt: number,
  /** The block's own row height — needed to turn an image's natural HEIGHT into a row count. */
  bodyRowHeightPt?: number,
): number {
  if (content.zones) {
    return content.zonesRowSpan ?? Number.POSITIVE_INFINITY;
  }

  const maxCharsPerLine = estimateCharsPerLine(widthPt, bodyFontPt);
  const lineCount = content.lines.reduce((sum, line) => sum + wrapText(line.text, maxCharsPerLine).length, 0);

  if (content.image) {
    if (content.image.rowSpan !== undefined) {
      return lineCount + content.image.rowSpan;
    }
    // A declared aspect turns "how wide am I" into "how tall do I want to
    // be", which is what lets a block shrink to its content instead of
    // always filling its column (2026-09-24).
    if (content.image.aspectRatio !== undefined && bodyRowHeightPt !== undefined && bodyRowHeightPt > 0) {
      const naturalRows = Math.ceil(widthPt / content.image.aspectRatio / bodyRowHeightPt);
      const ceiling = content.image.maxDemandRowSpan ?? Number.POSITIVE_INFINITY;
      return lineCount + Math.max(1, Math.min(naturalRows, ceiling));
    }
    return lineCount + (content.image.maxDemandRowSpan ?? Number.POSITIVE_INFINITY);
  }

  return lineCount;
}

/**
 * Splits a block's content rows between the runs inside it.
 *
 * Before this existed (bug found 2026-09-23, Barış's own report): a
 * `rowSpan`-less image took `lastRow - startRow + 1` rows — the whole rest
 * of the block — so ADIM 1's two side-by-side charts ate all 22 rows and a
 * third entry, a defect photo marked "Birincil", was dropped to an appendix
 * every single time. The block had grown to fit everything; placement then
 * handed it all to whoever came first. Any third entry on that step hit
 * this, not just photos.
 *
 * The rule: a run that knows its own size gets exactly that. What is left
 * over is split between the runs that do not, in equal shares, each capped
 * by its own declared ceiling so a greedy run cannot hoard what a later one
 * could use. Short by nature, not clever: a run still gets at least one row
 * so it is never starved into an appendix by the arithmetic itself, and any
 * remainder from a run that wanted less than its share is handed back to
 * the others rather than wasted.
 */
export function allocateRunRows(demands: readonly number[], availableRows: number): number[] {
  const count = demands.length;
  if (count === 0) {
    return [];
  }
  if (count === 1) {
    return [availableRows];
  }

  // Fewer rows than runs: the ones that fit get a row each, the rest get
  // none and take D-100's ordinary appendix route. Nothing clever to do
  // here — the block genuinely cannot hold them.
  if (availableRows <= count) {
    return demands.map((_unused, index) => (index < availableRows ? 1 : 0));
  }

  const allocation = demands.map(() => 0);
  const openEnded = demands.flatMap((demand, index) => (Number.isFinite(demand) ? [] : [index]));
  const finiteTotal = demands.reduce(
    (sum, demand) => sum + (Number.isFinite(demand) ? Math.max(1, demand) : 0),
    0,
  );

  if (finiteTotal <= availableRows) {
    // Everyone who knows their own size gets exactly it. A run that said it
    // had no natural size takes what is left — which is what "whatever
    // remains" always meant; it simply must not mean "including the rows
    // somebody else already needs".
    demands.forEach((demand, index) => {
      if (Number.isFinite(demand)) {
        allocation[index] = Math.max(1, demand);
      }
    });
    let remaining = availableRows - finiteTotal;
    if (openEnded.length === 0) {
      allocation[count - 1] = (allocation[count - 1] ?? 0) + remaining;
      return allocation;
    }
    openEnded.forEach((index, position) => {
      const share = Math.floor(remaining / (openEnded.length - position));
      allocation[index] = share;
      remaining -= share;
    });
    if (remaining > 0) {
      const last = openEnded[openEnded.length - 1]!;
      allocation[last] = (allocation[last] ?? 0) + remaining;
    }
    return allocation;
  }

  // The runs that know their own size ALREADY want more than the block has.
  // Share proportionally to what each asked for, never below one row —
  // first-come-first-served was the bug: the first run took everything and
  // every later entry was dropped to an appendix however small its need.
  const effective = demands.map((demand) => (Number.isFinite(demand) ? Math.max(1, demand) : 1));
  const total = effective.reduce((sum, demand) => sum + demand, 0);
  effective.forEach((demand, index) => {
    allocation[index] = Math.max(1, Math.floor((availableRows * demand) / total));
  });
  let leftover = availableRows - allocation.reduce((sum, rows) => sum + rows, 0);

  // Rounding remainder goes to the hungriest runs first, largest demand
  // down, so the result is deterministic rather than order-dependent.
  const byDemandDesc = effective
    .map((demand, index) => ({ demand, index }))
    .sort((a, b) => b.demand - a.demand || a.index - b.index);
  while (leftover !== 0) {
    let changed = false;
    for (const { index } of byDemandDesc) {
      if (leftover === 0) {
        break;
      }
      if (leftover > 0) {
        allocation[index] = (allocation[index] ?? 0) + 1;
        leftover -= 1;
        changed = true;
      } else if ((allocation[index] ?? 0) > 1) {
        allocation[index] = (allocation[index] ?? 0) - 1;
        leftover += 1;
        changed = true;
      }
    }
    if (!changed) {
      break;
    }
  }

  return allocation;
}
