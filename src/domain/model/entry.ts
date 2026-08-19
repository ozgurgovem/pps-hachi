import { z } from "zod";
import { ProvenanceSchema } from "./provenance";
import { EntryReferenceSchema } from "./reference";

export const A3VisibilitySchema = z.enum(["primary", "appendix", "hidden"]);
export type A3Visibility = z.infer<typeof A3VisibilitySchema>;

/**
 * D-119: an annotation drawn over an ingested photo, in coordinates
 * normalized to the photo's own box (0..1, origin top-left) — the survive-
 * any-scale property this design was chosen for (§14/D-119's own reasoning).
 * `shape` decides which of the positional fields are meaningful; the schema
 * itself stays loose (all optional beyond `id`/`shape`, matching D-51's own
 * reasoning) rather than a `z.discriminatedUnion`, since a persisted shape
 * is validated live by the drawing editor, not by strict parse-time
 * refinement — the same posture `EntryReferenceSchema`/`ImageRefSchema`
 * already take.
 *
 * - `arrow`: `x0,y0` tail → `x1,y1` head.
 * - `circle`: `x0,y0`/`x1,y1` are opposite corners of the bounding box an
 *   ellipse is drawn into.
 * - `callout`: `x0,y0` is the anchor point the label's leader line points
 *   at; `text` is the label.
 * - `path`: a freehand polyline, `points` (>= 2), `x0`/`y0`/`x1`/`y1` unused.
 */
export const AnnotationShapeSchema = z.enum(["arrow", "circle", "callout", "path"]);
export type AnnotationShape = z.infer<typeof AnnotationShapeSchema>;

export const AnnotationPointSchema = z.object({ x: z.number(), y: z.number() });
export type AnnotationPoint = z.infer<typeof AnnotationPointSchema>;

export const AnnotationSchema = z.looseObject({
  id: z.string(),
  shape: AnnotationShapeSchema,
  x0: z.number().optional(),
  y0: z.number().optional(),
  x1: z.number().optional(),
  y1: z.number().optional(),
  points: z.array(AnnotationPointSchema).optional(),
  text: z.string().optional(),
});
export type Annotation = z.infer<typeof AnnotationSchema>;

/**
 * D-118/D-193: `assetPath`/`thumbnailPath` name entries inside the same
 * `.ppsx` zip container (`ArchiveEntry.name`, e.g. `assets/img_{id}.jpg`) —
 * opaque strings to everything outside `image_import`'s own Rust command and
 * the composition root's asset-image resolver, never re-derived elsewhere.
 * `role` mirrors `EntryReference.role` (D-116): optional, loose (not
 * `z.enum`, same reasoning as D-51), and method-declared — `beforeAfter`'s
 * two roled slots ("before"/"after") are the first user; most methods
 * (Gemba's plain, unrolled photo list) never set it.
 *
 * D-119: `annotations` is optional and absent on every image ingested
 * before 6e-2 — an older `.ppsx` opens with no migration, the same
 * additive posture `references?`/`roundId?` already established.
 */
export const ImageRefSchema = z.looseObject({
  id: z.string(),
  assetPath: z.string(),
  thumbnailPath: z.string().optional(),
  role: z.string().optional(),
  annotations: z.array(AnnotationSchema).optional(),
});
export type ImageRef = z.infer<typeof ImageRefSchema>;

/**
 * D-52: `payload` is opaque at the `ProjectModel` level — validating it
 * against a method plugin's own schema is an edit/render-time concern, not
 * a project-load concern. An entry whose `methodId` this build doesn't know
 * must still round-trip untouched, so `payload` stays `z.unknown()` here.
 *
 * D-58: `roundId` links an entry to a `Round`; `Round` itself holds no
 * snapshot of the entries opened under it.
 *
 * D-116: `references` is optional and absent on every entry written before
 * Phase 6b — an older `.ppsx` opens with no migration, which is the whole
 * point of putting the relation on `Entry` rather than inside `payload`.
 * D-117: nothing here checks that a `targetEntryId` resolves. A dangling
 * reference is a *derived* condition (`findOrphanedReferences`), never a
 * load-time failure.
 */
export const EntrySchema = z.looseObject({
  id: z.string(),
  methodId: z.string(),
  title: z.string(),
  order: z.number(),
  a3Visibility: A3VisibilitySchema,
  payload: z.unknown(),
  images: z.array(ImageRefSchema),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
  author: z.string().optional(),
  provenance: ProvenanceSchema,
  roundId: z.string().optional(),
  references: z.array(EntryReferenceSchema).optional(),
});

export type Entry = z.infer<typeof EntrySchema>;
