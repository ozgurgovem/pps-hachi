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

/** A single line of text content destined for an A3 cell. */
export interface A3TextLine {
  readonly text: string;
  readonly bold?: boolean;
}

/**
 * What a method contributes to a block, before layout decides how much of
 * it fits. Deliberately minimal for Phase 4 — every method renders as
 * wrapped text lines; richer shapes (tables, charts-as-images) extend this
 * union in the phases that introduce them (5/6) without buildA3Layout itself
 * changing.
 */
export interface A3BlockContent {
  readonly lines: readonly A3TextLine[];
}

export interface A3EntrySummary {
  readonly id: string;
  readonly title: string;
}

export type A3EntryRenderer = (payload: unknown, entry: A3EntrySummary) => A3BlockContent;

export type A3EntryRendererMap = Readonly<Record<string, A3EntryRenderer>>;
