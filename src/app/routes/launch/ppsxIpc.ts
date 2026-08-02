import { invoke } from "@tauri-apps/api/core";
import type { RecentEntryMeta } from "./recentEntry";
import { errorMessage } from "./errorMessage";

export interface ArchiveEntryPayload {
  name: string;
  bytes: number[];
}

export interface PpsxReadResult {
  manifest: unknown;
  project: unknown;
  otherEntries: ArchiveEntryPayload[];
  /** D-77: pass back as `expectedModifiedMs` on the next `writePpsx` for this path. */
  modifiedMs: number;
}

export interface PpsxWriteResult {
  modifiedMs: number;
}

const CONFLICT_ERROR_PREFIX = "CONFLICT:";

/** D-77: thrown instead of a generic error when the file changed on disk since it was last read. */
export class PpsxWriteConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PpsxWriteConflictError";
  }
}

function rethrowAsPpsxError(error: unknown): never {
  const message = errorMessage(error);
  if (message.startsWith(CONFLICT_ERROR_PREFIX)) {
    throw new PpsxWriteConflictError(message.slice(CONFLICT_ERROR_PREFIX.length).trim());
  }
  throw error instanceof Error ? error : new Error(message);
}

/** D-55: Rust hands back raw, unvalidated JSON — Zod parsing happens on this result, not inside this wrapper. */
export function readPpsx(path: string): Promise<PpsxReadResult> {
  return invoke<PpsxReadResult>("ppsx_read", { path });
}

/**
 * D-79: `otherEntries` has no default — every call site must say explicitly
 * what happens to the archive's existing non-`manifest.json`/`project.json`
 * members (an empty array is a real, deliberate answer for a brand-new
 * project; a value carried forward from `readPpsx` is the answer for
 * everything else). Pass `expectedModifiedMs` from the last `readPpsx`/
 * `writePpsx` call for this path to get D-77's conflict detection — omit it
 * only when writing a file that has never been read (a brand-new project).
 */
export async function writePpsx(
  path: string,
  manifest: unknown,
  project: unknown,
  otherEntries: ArchiveEntryPayload[],
  expectedModifiedMs?: number,
): Promise<PpsxWriteResult> {
  try {
    return await invoke<PpsxWriteResult>("ppsx_write", {
      path,
      manifest,
      project,
      otherEntries,
      expectedModifiedMs,
    });
  } catch (error) {
    rethrowAsPpsxError(error);
  }
}

export function listRecentProjects(): Promise<RecentEntryMeta[]> {
  return invoke<RecentEntryMeta[]>("recent_list");
}

export function upsertRecentProject(entry: RecentEntryMeta): Promise<RecentEntryMeta[]> {
  return invoke<RecentEntryMeta[]>("recent_upsert", { entry });
}

/** D-74/D-75: history snapshots are a sidecar in app-local-data-dir, keyed by project id — never inside the `.ppsx`. */
export function listHistorySnapshots(projectId: string): Promise<string[]> {
  return invoke<string[]>("history_list", { projectId });
}

export function saveHistorySnapshot(
  projectId: string,
  timestamp: string,
  project: unknown,
  keepLast: number,
): Promise<void> {
  return invoke<void>("history_save", { projectId, timestamp, project, keepLast });
}

/** D-76: returns raw, unvalidated JSON — restoring runs it through the same migrate+Zod pipeline as opening a file. */
export function readHistorySnapshot(projectId: string, timestamp: string): Promise<unknown> {
  return invoke<unknown>("history_read", { projectId, timestamp });
}
