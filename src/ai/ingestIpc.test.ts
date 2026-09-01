import { describe, expect, test, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { ingestTablePreview } from "./ingestIpc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("ingestTablePreview", () => {
  test("invokes ingest_table_preview with the source path", async () => {
    const preview = {
      fileName: "defects.xlsx",
      fileSizeBytes: 1024,
      table: {
        headers: ["A"],
        rowCount: 1,
        sampleRows: [["1"]],
        stratifiedBy: null,
        groupCounts: [],
        truncated: false,
      },
    };
    mockInvoke.mockResolvedValueOnce(preview);

    const result = await ingestTablePreview("/Users/ada/defects.xlsx");

    expect(mockInvoke).toHaveBeenCalledWith("ingest_table_preview", { sourcePath: "/Users/ada/defects.xlsx" });
    expect(result).toEqual(preview);
  });

  test("rejects when the backend rejects (e.g. an unsupported file type)", async () => {
    mockInvoke.mockRejectedValueOnce(new Error('unsupported file type ".pdf"'));

    await expect(ingestTablePreview("/Users/ada/notes.pdf")).rejects.toThrow("unsupported file type");
  });
});
