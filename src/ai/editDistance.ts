/**
 * P-47/§2.6: `Provenance.editDistance` records how much a human changed an
 * AI draft before accepting it — SPEC.md §8.13's "is the assistant actually
 * good at this step, or is everyone rewriting it." D-201's own free-text
 * flow only ever needed a boolean (edited or not); a schema-bound proposal
 * has real structure, but there is no per-method way to weigh which field
 * changed without `EntryProposalField` knowing every plugin's payload shape
 * — which would break D-125's "declare, don't render" boundary the whole
 * generic-shell pattern depends on. Levenshtein distance over each
 * payload's `JSON.stringify()`, normalized by the longer string's length,
 * is deliberately the coarse, generic answer: it measures textual/
 * structural drift of the serialized form, not a semantically weighted
 * per-field distance — good enough as a first real signal (small and
 * self-contained), not a claim that a smarter, field-aware measure
 * wouldn't be better for a future revisit.
 */
export function normalizedEditDistance(before: string, after: string): number {
  if (before === after) {
    return 0;
  }
  const maxLength = Math.max(before.length, after.length);
  if (maxLength === 0) {
    return 0;
  }
  return levenshteinDistance(before, after) / maxLength;
}

function levenshteinDistance(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  let previousRow = Array.from({ length: cols }, (_, col) => col);

  for (let row = 1; row < rows; row++) {
    const currentRow = new Array<number>(cols);
    currentRow[0] = row;
    for (let col = 1; col < cols; col++) {
      const substitutionCost = a[row - 1] === b[col - 1] ? 0 : 1;
      currentRow[col] = Math.min(
        (previousRow[col] ?? 0) + 1,
        (currentRow[col - 1] ?? 0) + 1,
        (previousRow[col - 1] ?? 0) + substitutionCost,
      );
    }
    previousRow = currentRow;
  }

  return previousRow[b.length] ?? 0;
}
