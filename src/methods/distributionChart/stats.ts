import type { DistributionPoint, DistributionSample } from "./schema";

/** A blank or non-numeric cell contributes nothing — same posture as `causeEffectMatrix/score.ts`'s `scoreValue`. */
function parseNumber(raw: string | undefined): number | undefined {
  if (raw === undefined) {
    return undefined;
  }
  const trimmed = raw.trim();
  if (trimmed.length === 0) {
    return undefined;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : undefined;
}

export function parseSampleValues(samples: readonly DistributionSample[]): readonly number[] {
  return samples
    .map((sample) => parseNumber(sample.value))
    .filter((value): value is number => value !== undefined);
}

export function parsePoints(points: readonly DistributionPoint[]): readonly { readonly x: number; readonly y: number }[] {
  return points
    .map((point) => ({ x: parseNumber(point.x), y: parseNumber(point.y) }))
    .filter((point): point is { x: number; y: number } => point.x !== undefined && point.y !== undefined);
}

/** Sturges' rule, the standard default bin count for a histogram of `n` samples. */
export function sturgesBinCount(n: number): number {
  if (n <= 1) {
    return 1;
  }
  return Math.max(1, Math.ceil(Math.log2(n) + 1));
}

export interface HistogramBin {
  readonly rangeLabel: string;
  readonly count: number;
}

/**
 * Equal-width bins spanning `[min, max]`. Returns an empty array for fewer
 * than 2 samples — a histogram of one point has no meaningful range.
 */
export function computeHistogramBins(values: readonly number[], binCount?: number): readonly HistogramBin[] {
  if (values.length < 2) {
    return [];
  }
  const min = Math.min(...values);
  const max = Math.max(...values);
  const bins = Math.max(1, binCount ?? sturgesBinCount(values.length));
  const width = max === min ? 1 : (max - min) / bins;

  const counts = new Array<number>(bins).fill(0);
  for (const value of values) {
    const index = width === 0 ? 0 : Math.min(bins - 1, Math.floor((value - min) / width));
    counts[index] = (counts[index] ?? 0) + 1;
  }

  return counts.map((count, index) => {
    const lower = min + index * width;
    const upper = index === bins - 1 ? max : min + (index + 1) * width;
    return { rangeLabel: `${lower.toFixed(1)}–${upper.toFixed(1)}`, count };
  });
}

export interface BoxPlotStats {
  readonly min: number;
  readonly q1: number;
  readonly median: number;
  readonly q3: number;
  readonly max: number;
}

function median(sorted: readonly number[]): number {
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2 : (sorted[mid] ?? 0);
}

/**
 * Tukey's hinges: the median splits the sorted sample in half (excluding
 * the middle value itself when `n` is odd), and Q1/Q3 are the medians of
 * the two halves. Undefined for fewer than 2 samples — quartiles of a
 * single point are meaningless.
 */
export function computeBoxPlotStats(values: readonly number[]): BoxPlotStats | undefined {
  if (values.length < 2) {
    return undefined;
  }
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const lowerHalf = sorted.slice(0, mid);
  const upperHalf = sorted.length % 2 === 0 ? sorted.slice(mid) : sorted.slice(mid + 1);

  return {
    min: sorted[0] ?? 0,
    q1: median(lowerHalf),
    median: median(sorted),
    q3: median(upperHalf),
    max: sorted[sorted.length - 1] ?? 0,
  };
}
