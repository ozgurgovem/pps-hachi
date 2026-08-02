import {
  CURRENT_SCHEMA_VERSION,
  ManifestSchema,
  ProjectModelSchema,
  type Manifest,
  type ProjectModel,
} from "../../../domain/model";
import { runMigrations } from "../../../domain/migrations";
import { errorMessage } from "./errorMessage";
import { readPpsx, upsertRecentProject, type ArchiveEntryPayload } from "./ppsxIpc";
import { buildRecentEntryMeta } from "./recentEntry";

export type OpenProjectOutcome =
  | {
      kind: "opened";
      manifest: Manifest;
      project: ProjectModel;
      path: string;
      readOnly: boolean;
      readOnlyReason?: "newer-schema";
      /**
       * D-79: everything in the archive besides `manifest.json`/`project.json`,
       * carried forward unchanged. Threading this through is what makes the
       * next `writePpsx` call for this project not silently drop it — see
       * D-79's post-mortem: nothing previously read this field back out.
       */
      otherEntries: ArchiveEntryPayload[];
      /** D-77: pass through to the next `writePpsx` call as `expectedModifiedMs`. */
      modifiedMs: number;
    }
  | { kind: "corrupt"; path: string; reason: string };

export type ResolveProjectResult =
  | { ok: true; project: ProjectModel; readOnly: boolean; readOnlyReason?: "newer-schema" }
  | { ok: false; reason: string };

/**
 * D-76: the shared migrate → validate pipeline. Extracted so
 * `openProjectAtPath` and the state layer's `restoreFromSnapshot` (D-75)
 * run through the exact same rules instead of two implementations that can
 * drift — a `history/*.json` blob is untrusted JSON from a file (D-19)
 * exactly like a freshly-opened `.ppsx`'s `project.json` is.
 */
export function resolveProjectAgainstCurrentSchema(
  rawProject: unknown,
  schemaVersion: number,
): ResolveProjectResult {
  if (schemaVersion > CURRENT_SCHEMA_VERSION) {
    const result = ProjectModelSchema.safeParse(rawProject);
    if (!result.success) {
      return { ok: false, reason: "project.json does not match the expected shape" };
    }
    return { ok: true, project: result.data, readOnly: true, readOnlyReason: "newer-schema" };
  }

  let migrated: unknown;
  try {
    migrated =
      schemaVersion < CURRENT_SCHEMA_VERSION
        ? runMigrations(rawProject, schemaVersion, CURRENT_SCHEMA_VERSION)
        : rawProject;
  } catch (error) {
    return { ok: false, reason: errorMessage(error) };
  }

  const result = ProjectModelSchema.safeParse(migrated);
  if (!result.success) {
    return { ok: false, reason: "project.json does not match the expected shape" };
  }
  return { ok: true, project: result.data, readOnly: false };
}

/**
 * D-61: this is also what "Import .ppsx" means — opening a file from
 * anywhere on disk, there is no separate import path.
 *
 * D-54/D-59/D-57 drive the branching: read the manifest first; a file newer
 * than this build understands opens read-only rather than being refused; an
 * older one runs through the migration chain before validation.
 */
export async function openProjectAtPath(path: string): Promise<OpenProjectOutcome> {
  let raw: Awaited<ReturnType<typeof readPpsx>>;
  try {
    raw = await readPpsx(path);
  } catch (error) {
    return { kind: "corrupt", path, reason: errorMessage(error) };
  }

  const manifestResult = ManifestSchema.safeParse(raw.manifest);
  if (!manifestResult.success) {
    return { kind: "corrupt", path, reason: "manifest.json does not match the expected shape" };
  }
  const manifest = manifestResult.data;

  const resolved = resolveProjectAgainstCurrentSchema(raw.project, manifest.schemaVersion);
  if (!resolved.ok) {
    return { kind: "corrupt", path, reason: resolved.reason };
  }

  return finishOpen(manifest, resolved.project, path, raw.otherEntries, raw.modifiedMs, {
    readOnly: resolved.readOnly,
    ...(resolved.readOnlyReason ? { readOnlyReason: resolved.readOnlyReason } : {}),
  });
}

async function finishOpen(
  manifest: Manifest,
  project: ProjectModel,
  path: string,
  otherEntries: ArchiveEntryPayload[],
  modifiedMs: number,
  readOnlyState: { readOnly: boolean; readOnlyReason?: "newer-schema" },
): Promise<OpenProjectOutcome> {
  // Best-effort: a project that just opened successfully should still open
  // even if the recent-list cache write fails for some unrelated reason.
  try {
    await upsertRecentProject(buildRecentEntryMeta(manifest, project, path));
  } catch {
    // Swallowed deliberately — see comment above. The disk read already succeeded.
  }
  // exactOptionalPropertyTypes: only include readOnlyReason when it has a
  // real value — setting it to `undefined` explicitly is a different (and
  // disallowed) thing from omitting the key.
  return {
    kind: "opened",
    manifest,
    project,
    path,
    otherEntries,
    modifiedMs,
    readOnly: readOnlyState.readOnly,
    ...(readOnlyState.readOnlyReason ? { readOnlyReason: readOnlyState.readOnlyReason } : {}),
  };
}
