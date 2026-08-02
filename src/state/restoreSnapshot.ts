import { z } from "zod";
import type { ProjectModel } from "../domain/model";
import { resolveProjectAgainstCurrentSchema } from "../app/routes/launch/openProjectFlow";

const SchemaVersionPeekSchema = z.looseObject({ schemaVersion: z.number().int().positive() });

export type ResolveSnapshotResult = { ok: true; project: ProjectModel } | { ok: false; reason: string };

/**
 * D-76: a history snapshot is untrusted JSON from a file (D-19), exactly
 * like a freshly-opened `.ppsx`'s `project.json` — it runs through the same
 * migrate + validate pipeline `openProjectAtPath` uses (D-54-style routing
 * peek first, since the snapshot carries no `manifest.json` to read a
 * `schemaVersion` from otherwise), plus an id-equality check against the
 * project currently open — a snapshot can only ever belong to the project
 * it was taken from.
 */
export function resolveSnapshotForRestore(raw: unknown, currentProjectId: string): ResolveSnapshotResult {
  const peek = SchemaVersionPeekSchema.safeParse(raw);
  if (!peek.success) {
    return { ok: false, reason: "This autosave point is corrupt and can't be restored." };
  }

  const resolved = resolveProjectAgainstCurrentSchema(raw, peek.data.schemaVersion);
  if (!resolved.ok) {
    return { ok: false, reason: resolved.reason };
  }

  if (resolved.project.id !== currentProjectId) {
    return { ok: false, reason: "This autosave point belongs to a different project." };
  }

  return { ok: true, project: resolved.project };
}
