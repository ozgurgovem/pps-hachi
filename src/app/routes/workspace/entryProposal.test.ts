import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { AttachmentPreview } from "../../../ai/ingestIpc";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { completeStructured } from "../../../ai/structuredIpc";
import {
  buildProposalPrompt,
  buildRetryPrompt,
  formatIngestedTableForPrompt,
  formatZodErrors,
  proposeStructuredEntry,
} from "./entryProposal";

vi.mock("../../../ai/structuredIpc", () => ({
  completeStructured: vi.fn(),
}));

const mockCompleteStructured = vi.mocked(completeStructured);

beforeEach(() => {
  mockCompleteStructured.mockReset();
});

const TestSchema = z.object({ unit: z.string(), count: z.number() });
const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

describe("buildProposalPrompt", () => {
  it("appends the user's data below the prompt body", () => {
    const prompt = buildProposalPrompt("Draft a thing.", "raw pasted data");

    expect(prompt).toContain("Draft a thing.");
    expect(prompt).toContain("raw pasted data");
  });
});

describe("buildRetryPrompt", () => {
  it("includes the original prompt, the previous response, and the validation errors", () => {
    const prompt = buildRetryPrompt("Draft a thing.", "raw data", '{"bad":true}', "- count: expected number");

    expect(prompt).toContain("Draft a thing.");
    expect(prompt).toContain("raw data");
    expect(prompt).toContain('{"bad":true}');
    expect(prompt).toContain("count: expected number");
  });
});

describe("formatZodErrors", () => {
  it("formats each issue with its path and message", () => {
    const result = TestSchema.safeParse({ unit: "count", count: "not a number" });
    if (result.success) {
      throw new Error("expected validation to fail");
    }

    const formatted = formatZodErrors(result.error);

    expect(formatted).toContain("count");
    expect(formatted).toMatch(/expected number|invalid_type/i);
  });
});

describe("formatIngestedTableForPrompt", () => {
  function preview(overrides: Partial<AttachmentPreview["table"]> = {}): AttachmentPreview {
    return {
      fileName: "defects.xlsx",
      fileSizeBytes: 2048,
      table: {
        headers: ["Defect Category", "Count"],
        rowCount: 5,
        sampleRows: [["Scratch", "3"]],
        stratifiedBy: null,
        groupCounts: [],
        truncated: false,
        ...overrides,
      },
    };
  }

  it("includes the file name, columns and a plain row count when not stratified", () => {
    const text = formatIngestedTableForPrompt(preview());

    expect(text).toContain("defects.xlsx");
    expect(text).toContain("Defect Category, Count");
    expect(text).toContain("Total rows: 5");
    expect(text).toContain("Defect Category=Scratch, Count=3");
  });

  it("reports the stratification column and group counts when stratified", () => {
    const text = formatIngestedTableForPrompt(
      preview({
        stratifiedBy: "Defect Category",
        groupCounts: [
          { value: "Scratch", count: 3 },
          { value: "Dent", count: 2 },
        ],
        sampleRows: [
          ["Scratch", "1"],
          ["Dent", "1"],
        ],
      }),
    );

    expect(text).toContain('stratified sample by "Defect Category"');
    expect(text).toContain("- Scratch: 3");
    expect(text).toContain("- Dent: 2");
  });

  it("notes truncation when the sample was capped", () => {
    const text = formatIngestedTableForPrompt(preview({ truncated: true, rowCount: 500 }));

    expect(text).toContain("showing the first");
  });
});

describe("proposeStructuredEntry", () => {
  it("returns success with the validated value on the first attempt", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "5 defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction: OFF,
    });

    expect(result).toEqual({ outcome: "success", value: { unit: "count", count: 5 } });
    expect(mockCompleteStructured).toHaveBeenCalledTimes(1);
  });

  it("forwards the redaction policy to completeStructured on every attempt", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: "five" });
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });
    const redaction: ResolvedRedactionPolicy = { mode: "customers", terms: ["Acme Corp"], preserveNumbers: true };

    await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "five defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction,
    });

    expect(mockCompleteStructured.mock.calls[0]?.[3]).toEqual(redaction);
    expect(mockCompleteStructured.mock.calls[1]?.[3]).toEqual(redaction);
  });

  it("retries once with validation errors appended when the first response fails schema validation", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: "five" });
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "five defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction: OFF,
    });

    expect(result).toEqual({ outcome: "success", value: { unit: "count", count: 5 } });
    expect(mockCompleteStructured).toHaveBeenCalledTimes(2);
    const secondPrompt = mockCompleteStructured.mock.calls[1]?.[0];
    expect(secondPrompt).toContain("Validation errors");
  });

  it("returns failed with the raw text after a second schema-validation failure", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: "five" });
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: "still not a number" });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "five defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction: OFF,
    });

    expect(result.outcome).toBe("failed");
    if (result.outcome === "failed") {
      expect(result.rawText).toContain("still not a number");
    }
    expect(mockCompleteStructured).toHaveBeenCalledTimes(2);
  });

  it("treats a non-JSON backend rejection as a failure eligible for one retry", async () => {
    mockCompleteStructured.mockRejectedValueOnce(new Error("model response was not valid JSON"));
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "five defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction: OFF,
    });

    expect(result).toEqual({ outcome: "success", value: { unit: "count", count: 5 } });
    expect(mockCompleteStructured).toHaveBeenCalledTimes(2);
  });

  it("returns failed after two consecutive non-JSON backend rejections, never writing anything", async () => {
    mockCompleteStructured.mockRejectedValueOnce(new Error("not json"));
    mockCompleteStructured.mockRejectedValueOnce(new Error("still not json"));

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "five defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction: OFF,
    });

    expect(result).toEqual({ outcome: "failed", rawText: "still not json" });
  });

  it("sends a JSON Schema derived from the Zod schema on every attempt", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });

    await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "5 defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
      redaction: OFF,
    });

    const schemaArg = mockCompleteStructured.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(schemaArg.type).toBe("object");
    expect(schemaArg.properties).toMatchObject({ unit: { type: "string" }, count: { type: "number" } });
  });
});
