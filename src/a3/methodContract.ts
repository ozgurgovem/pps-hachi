/**
 * D-07: every method plugin owns a `renderToA3`. `MethodPlugin` itself lives
 * in `src/methods/types.ts` and imports React (for `Editor`), which
 * `src/a3` may never import (D-43/D-94). This file is the pure seam between
 * the two: `buildA3Layout` depends only on this contract and receives an
 * implementation map from its caller (dependency injection), never on
 * `src/methods` directly. Adding a method still means touching one plugin
 * file, per D-07 — `src/methods/registry.ts` assembles the map this
 * contract describes from the same registration every plugin already does.
 */

/**
 * D-41's shape-coded status marker, reinforcement half (P-37): the shape
 * (a glyph a method prepends to its own text) carries the meaning, this
 * carries the colour that backs it up — never the reverse. Fixed to
 * §14.3's own reading of D-41: green/positive = done, blue/caution =
 * in progress, red/negative = blocked. Three tones cover every status
 * vocabulary shipped so far; a plugin maps its own values onto one of them.
 */
export type A3TextTone = "positive" | "caution" | "negative";

/** A single line of text content destined for an A3 cell. */
export interface A3TextLine {
  readonly text: string;
  readonly bold?: boolean;
  readonly tone?: A3TextTone;
}

/**
 * Phase 5 (DECISIONS.md D-102): what a chart/diagram method wants rendered
 * into its block, as a pure *spec* — never pixels. `kind` is opaque routing
 * data for `src/a3/render/rasterize.ts`'s dispatch table; `place.ts`/
 * `buildA3Layout.ts` never branch on it, only on whether `image` is present.
 * `spec` is `unknown` here deliberately — the concrete shape (`ChartSpec`,
 * a fishbone graph, …) is a method/rasterizer concern, not a layout one,
 * mirroring how `Entry.payload` stays opaque at the `ProjectModel` level
 * (D-52) one layer up.
 */
export type A3ImageKind =
  | "pareto-chart"
  | "trend-chart"
  | "trajectory-chart"
  | "fishbone-diagram"
  | "distribution-chart";

/**
 * The explicit pixel box a method's chart/diagram must draw itself into.
 * Passed to `renderImage` by `src/a3/render/rasterize.ts` so charts never
 * infer their own size from a measured parent — a measurement-driven
 * container (Recharts' `ResponsiveContainer`, React Flow's `fitView`)
 * renders nothing until a ResizeObserver cycle completes, which is exactly
 * the "blank exported chart" failure D-102's rasterizer exists to prevent.
 */
export interface A3ImageSize {
  readonly widthPx: number;
  readonly heightPx: number;
}

export interface A3ImageRequest {
  readonly kind: A3ImageKind;
  readonly spec: unknown;
  /** How many of the block's content rows this image should reserve, vertical-stack blocks only. */
  readonly rowSpan?: number;
}

/** One horizontal slice of a single reserved row-span — Step 3's D-38 three-zone strip. */
export interface A3ContentZone {
  /** 0..1, fraction of the block's content-column width this zone occupies. Zones should sum to ~1. */
  readonly widthFraction: number;
  readonly lines?: readonly A3TextLine[];
  readonly image?: A3ImageRequest;
}

/**
 * What a method contributes to a block, before layout decides how much of
 * it fits. `lines` is the Phase 4 default (vertical stack, one wrapped line
 * per content row). `image` extends that same vertical stack with a
 * chart/diagram consuming `rowSpan` rows instead of text (Pareto, Trend,
 * Fishbone). `zones` replaces the vertical stack entirely with a horizontal
 * partition of one reserved row-span (SMART Target) — a generic mechanism,
 * not hardcoded to any one step; see DECISIONS.md D-102.
 */
export interface A3BlockContent {
  readonly lines: readonly A3TextLine[];
  readonly image?: A3ImageRequest;
  readonly zones?: readonly A3ContentZone[];
}

export interface A3EntrySummary {
  readonly id: string;
  readonly title: string;
}

export type A3EntryRenderer = (payload: unknown, entry: A3EntrySummary) => A3BlockContent;

export type A3EntryRendererMap = Readonly<Record<string, A3EntryRenderer>>;
