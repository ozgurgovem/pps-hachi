import { z } from "zod";

/**
 * D-54: the routing header — read first, decides migrate / refuse /
 * open-read-only before `project.json` is touched. Loose for the same
 * reason as `ProjectModelSchema` (D-51): a newer build's manifest field
 * must not be deleted by an older build re-saving the file.
 */
export const ManifestSchema = z.looseObject({
  id: z.string().min(1),
  schemaVersion: z.number().int().positive(),
  appVersion: z.string().min(1),
  created: z.iso.datetime(),
  modified: z.iso.datetime(),
});

export type Manifest = z.infer<typeof ManifestSchema>;
