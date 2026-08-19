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
  | "distribution-chart"
  | "kpi-strip"
  | "why-why-diagram"
  /**
   * D-118/D-193: an ingested photo (`Entry.images[]`), not a chart/diagram
   * spec — never rasterized, never registered in `getA3ImageRendererMap()`.
   * Exists so `A3ImageRequest.kind` stays honestly typed for an asset-
   * sourced request rather than borrowing an unrelated chart kind.
   */
  | "asset-photo"
  /**
   * D-119/6e-2: an ingested photo that carries one or more `Annotation`s.
   * Unlike `"asset-photo"`, this *is* rasterized — `spec` carries the
   * photo's bytes (resolved by the composition root, never `place.ts`) plus
   * its annotation list, and the shared renderer (`AnnotatedPhotoCanvas`,
   * `src/methods/shared/annotatedPhoto.ts`) composites the photo with an
   * SVG overlay before capture. Shared by `defect-photo-board`,
   * `spaghetti-diagram` and `value-stream-map` — only one of the three
   * registers the renderer in `getA3ImageRendererMap()` (C2's precedent).
   */
  | "annotated-photo";

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
  /**
   * D-118/D-193: omitted (the Phase 5/D-102 default) means `kind`/`spec`
   * must be rasterized by `src/a3/render/rasterize.ts`. `"asset"` means the
   * image already exists as bytes — an ingested photo — and `assetImageId`
   * names which `Entry.images[]` entry supplies them; `kind`/`spec` are
   * ignored (by convention `kind: "asset-photo"`, `spec: undefined`) and
   * the composition root (`a3Preview.ts`) resolves the placement directly,
   * skipping rasterization entirely. `place.ts` computes identical geometry
   * for both sources — only the composition root's resolver forks.
   */
  readonly source?: "asset" | undefined;
  readonly assetImageId?: string | undefined;
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

/**
 * D-118/D-193: mirrors `domain/model/entry.ts`'s `ImageRef` shape
 * structurally rather than importing it — `src/a3` stays free to describe
 * its own contract without depending on Zod's inferred type shape (the
 * fields themselves are the actual contract; a schema change that keeps
 * these three names/types compatible costs nothing here).
 */
/**
 * D-119: structurally mirrors `domain/model/entry.ts`'s `Annotation` — see
 * that file's own doc comment for the shape's field meanings. `points`'s
 * array type is deliberately *not* wrapped in `readonly` (unlike every
 * other array in this file) — Zod's own inferred `Annotation["points"]` is
 * a plain mutable array (`z.array` gives no readonly variant without an
 * explicit `.readonly()`, which the domain model doesn't use), and a
 * `readonly` array here would make this type structurally incompatible
 * with `Annotation` at exactly this one field, breaking the property-order
 * pass-through in `defectPhotoBoard/index.ts`'s `renderImage`.
 */
export interface A3EntryAnnotation {
  readonly id: string;
  readonly shape: "arrow" | "circle" | "callout" | "path";
  readonly x0?: number | undefined;
  readonly y0?: number | undefined;
  readonly x1?: number | undefined;
  readonly y1?: number | undefined;
  readonly points?: { readonly x: number; readonly y: number }[] | undefined;
  readonly text?: string | undefined;
}

export interface A3EntryImageRef {
  readonly id: string;
  readonly assetPath: string;
  readonly thumbnailPath?: string | undefined;
  readonly role?: string | undefined;
  readonly annotations?: readonly A3EntryAnnotation[] | undefined;
}

/**
 * D-188/P-26 (i18n half): the project's own `meta.language` (`ProjectModel`,
 * `"tr" | "en"`), forwarded through `buildA3Layout`'s existing dependency-
 * injection seam so every `renderToA3` can pick the right export text without
 * `src/a3` ever importing i18next (D-43). Optional and defaulting to `"en"`
 * via `resolveA3Language` — additive, no migration, same posture as
 * `Entry.references?` (D-128): every hand-built `A3EntrySummary` test fixture
 * predating this field keeps compiling and keeps its original (English)
 * expected output unchanged.
 */
export type A3Language = "tr" | "en";

export interface A3EntrySummary {
  readonly id: string;
  readonly title: string;
  readonly language?: A3Language;
  /**
   * D-118/D-193: lets a method's `renderToA3` reference a specific ingested
   * photo's id in an asset-sourced `A3ImageRequest` (`source: "asset"`,
   * `assetImageId`). Optional, defaulting to `[]` via `resolveA3Images` —
   * additive, same posture as `language?` above, so every hand-built
   * `A3EntrySummary` test fixture predating this field keeps compiling.
   */
  readonly images?: readonly A3EntryImageRef[];
}

/** The pre-D-188 default was unconditional English — `"en"` preserves that for any `A3EntrySummary` built without `language`. */
export function resolveA3Language(entry: A3EntrySummary): A3Language {
  return entry.language ?? "en";
}

/** Mirrors `resolveA3Language` — an `A3EntrySummary` built before D-193 (or in a test fixture) carries no images at all. */
export function resolveA3Images(entry: A3EntrySummary): readonly A3EntryImageRef[] {
  return entry.images ?? [];
}

export type A3EntryRenderer = (payload: unknown, entry: A3EntrySummary) => A3BlockContent;

export type A3EntryRendererMap = Readonly<Record<string, A3EntryRenderer>>;
