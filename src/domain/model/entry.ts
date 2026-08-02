import { z } from "zod";
import { ProvenanceSchema } from "./provenance";

export const A3VisibilitySchema = z.enum(["primary", "appendix", "hidden"]);
export type A3Visibility = z.infer<typeof A3VisibilitySchema>;

const ImageRefSchema = z.looseObject({
  id: z.string(),
  assetPath: z.string(),
  thumbnailPath: z.string().optional(),
});

/**
 * D-52: `payload` is opaque at the `ProjectModel` level — validating it
 * against a method plugin's own schema is an edit/render-time concern, not
 * a project-load concern. An entry whose `methodId` this build doesn't know
 * must still round-trip untouched, so `payload` stays `z.unknown()` here.
 *
 * D-58: `roundId` links an entry to a `Round`; `Round` itself holds no
 * snapshot of the entries opened under it.
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
});

export type Entry = z.infer<typeof EntrySchema>;
