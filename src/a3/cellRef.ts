/** A1-notation parsing shared by `HtmlA3Renderer` (grid placement) and tests. Pure. */

export interface ParsedCellRef {
  readonly column: string;
  readonly row: number;
}

const CELL_REF_PATTERN = /^([A-Z]+)(\d+)$/;

export function parseCellRef(ref: string): ParsedCellRef {
  const match = CELL_REF_PATTERN.exec(ref);
  if (!match) {
    throw new Error(`Invalid cell reference: "${ref}"`);
  }
  // Both capture groups are guaranteed present when the overall match succeeds.
  return { column: match[1]!, row: Number(match[2]!) };
}

/** 0-based: A=0, B=1, …, Z=25, AA=26, AB=27, … */
export function columnLetterToIndex(letters: string): number {
  let index = 0;
  for (const char of letters) {
    index = index * 26 + (char.charCodeAt(0) - "A".charCodeAt(0) + 1);
  }
  return index - 1;
}

export interface ParsedRange {
  readonly start: ParsedCellRef;
  readonly end: ParsedCellRef;
}

export function parseRange(range: string): ParsedRange {
  const [startRef, endRef] = range.split(":");
  const start = parseCellRef(startRef ?? range);
  const end = endRef ? parseCellRef(endRef) : start;
  return { start, end };
}
