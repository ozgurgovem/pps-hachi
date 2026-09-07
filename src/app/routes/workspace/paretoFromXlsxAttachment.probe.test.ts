import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AttachmentPreview } from "../../../ai/ingestIpc";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { completeStructured } from "../../../ai/structuredIpc";
import { getMethodById } from "../../../methods";
import { formatIngestedTableForPrompt, proposeStructuredEntry } from "./entryProposal";

/**
 * J2/D-205: Faz 9's own literal done-criterion ("propose a valid Pareto
 * entry from an uploaded xlsx") is a two-language claim — Rust reads the
 * real file (proven by `ingest/xlsx_source.rs`'s own tests against a real
 * xlsx built with `rust_xlsxwriter`), TS turns that summary into a prompt
 * and validates the model's structured response (proven here). This is the
 * permanent PROBE test that chains the TS half end to end with a
 * *realistic* `AttachmentPreview` — the exact shape `ingest_table_preview`
 * produces for a genuinely Pareto-shaped sheet (stratified by a category
 * column, per `table.rs`'s own stratification rule) — through
 * `formatIngestedTableForPrompt` and `proposeStructuredEntry`, landing on a
 * real, schema-validated `ParetoPayload`. The one thing this cannot prove
 * from this environment (no display, no real Tauri window) is a real
 * Vorion round trip — the same honestly-owed gap D-105/D-113/D-136/D-200/
 * D-201/D-204 already recorded for their own real-webview walkthroughs.
 */

vi.mock("../../../ai/structuredIpc", () => ({
  completeStructured: vi.fn(),
}));

const mockCompleteStructured = vi.mocked(completeStructured);

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

beforeEach(() => {
  mockCompleteStructured.mockReset();
});

/** The shape `ingest_table_preview` returns for a real, Pareto-shaped xlsx
 * sheet — a "Defect Category" column with six repeated values over 52 rows
 * qualifies for stratification (`STRATIFY_MAX_UNIQUE_RATIO`), matching
 * `ingest/table.rs`'s own real algorithm, not an idealized shape. */
function realisticParetoAttachment(): AttachmentPreview {
  return {
    fileName: "cavity-defects-week12.xlsx",
    fileSizeBytes: 18_432,
    table: {
      headers: ["Defect Category", "Cavity", "Shift"],
      rowCount: 52,
      stratifiedBy: "Defect Category",
      truncated: false,
      groupCounts: [
        { value: "Flash", count: 22 },
        { value: "Short Shot", count: 14 },
        { value: "Warpage", count: 9 },
        { value: "Sink Mark", count: 4 },
        { value: "Discoloration", count: 3 },
      ],
      sampleRows: [
        ["Flash", "C3", "Day"],
        ["Short Shot", "C1", "Night"],
        ["Warpage", "C2", "Day"],
        ["Sink Mark", "C4", "Night"],
        ["Discoloration", "C1", "Day"],
      ],
    },
  };
}

describe("Faz 9 done-criterion: propose a valid Pareto entry from an uploaded xlsx", () => {
  it("chains a realistic AttachmentPreview through the prompt and lands on a schema-valid ParetoPayload", async () => {
    const paretoPlugin = getMethodById("pareto");
    if (!paretoPlugin) {
      throw new Error("pareto method must be registered for this probe to run");
    }

    const attachment = realisticParetoAttachment();
    const fileSummary = formatIngestedTableForPrompt(attachment);

    // What a real Vorion response would look like for this exact sheet —
    // stands in for the network call this environment cannot make.
    mockCompleteStructured.mockResolvedValueOnce({
      unit: "count",
      categories: [
        { id: "flash", label: "Flash", count: 22 },
        { id: "short-shot", label: "Short Shot", count: 14 },
        { id: "warpage", label: "Warpage", count: 9 },
        { id: "sink-mark", label: "Sink Mark", count: 4 },
        { id: "discoloration", label: "Discoloration", count: 3 },
      ],
    });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a Pareto chart of the attached defect data.",
      userInput: fileSummary,
      modelId: "vorion/gpt-4o",
      zodSchema: paretoPlugin.schema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "pareto.v1",
    });

    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") {
      throw new Error("expected the proposal to succeed");
    }

    // The value returned is what EntryProposalField hands to the plugin's
    // own Editor for review, and eventually to Accept — proving it parses
    // as a real ParetoPayload is proving the literal done-criterion.
    const parsed = paretoPlugin.schema.parse(result.value);
    expect(parsed).toMatchObject({
      unit: "count",
      categories: expect.arrayContaining([expect.objectContaining({ label: "Flash", count: 22 })]),
    });

    // The prompt actually sent carries the real file's data, not a stand-in.
    const promptSent = mockCompleteStructured.mock.calls[0]?.[0] as string;
    expect(promptSent).toContain("cavity-defects-week12.xlsx");
    expect(promptSent).toContain("Flash: 22");
  });

  it("still succeeds after one retry when the model's first response fails schema validation", async () => {
    const paretoPlugin = getMethodById("pareto");
    if (!paretoPlugin) {
      throw new Error("pareto method must be registered for this probe to run");
    }
    const fileSummary = formatIngestedTableForPrompt(realisticParetoAttachment());

    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", categories: [{ id: "flash", label: "Flash" }] }); // missing count
    mockCompleteStructured.mockResolvedValueOnce({
      unit: "count",
      categories: [{ id: "flash", label: "Flash", count: 22 }],
    });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a Pareto chart of the attached defect data.",
      userInput: fileSummary,
      modelId: "vorion/gpt-4o",
      zodSchema: paretoPlugin.schema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "pareto.v1",
    });

    expect(result.outcome).toBe("success");
    expect(mockCompleteStructured).toHaveBeenCalledTimes(2);
  });
});
