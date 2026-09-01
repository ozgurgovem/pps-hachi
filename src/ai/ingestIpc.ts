import { invoke } from "@tauri-apps/api/core";

/** Mirrors `src-tauri/src/ingest/table.rs::GroupCount`. */
export interface GroupCount {
  readonly value: string;
  readonly count: number;
}

/** Mirrors `src-tauri/src/ingest/table.rs::IngestedTable` — the compact
 * structured representation SPEC.md §8.9 asks for, already stratified/
 * capped on the Rust side (`MAX_SAMPLE_ROWS`). */
export interface IngestedTable {
  readonly headers: readonly string[];
  readonly rowCount: number;
  readonly sampleRows: readonly (readonly string[])[];
  readonly stratifiedBy: string | null;
  readonly groupCounts: readonly GroupCount[];
  readonly truncated: boolean;
}

/** Mirrors `src-tauri/src/ingest/commands.rs::AttachmentPreview` — what the
 * attachment review sheet (SPEC.md §8.9) renders before anything is sent. */
export interface AttachmentPreview {
  readonly fileName: string;
  readonly fileSizeBytes: number;
  readonly table: IngestedTable;
}

/**
 * D-118's "Rust reads the file, the webview never sees raw bytes" posture
 * applied to tabular data: `sourcePath` is a path from the native file
 * dialog, Rust opens and parses it — no spreadsheet content ever crosses
 * into TypeScript except this already-summarized, already-capped preview.
 */
export function ingestTablePreview(sourcePath: string): Promise<AttachmentPreview> {
  return invoke<AttachmentPreview>("ingest_table_preview", { sourcePath });
}
