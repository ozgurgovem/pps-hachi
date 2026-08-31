import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import { completeStructured } from "../../../ai/structuredIpc";
import {
  buildProposalPrompt,
  buildRetryPrompt,
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

describe("proposeStructuredEntry", () => {
  it("returns success with the validated value on the first attempt", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "5 defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
    });

    expect(result).toEqual({ outcome: "success", value: { unit: "count", count: 5 } });
    expect(mockCompleteStructured).toHaveBeenCalledTimes(1);
  });

  it("retries once with validation errors appended when the first response fails schema validation", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: "five" });
    mockCompleteStructured.mockResolvedValueOnce({ unit: "count", count: 5 });

    const result = await proposeStructuredEntry({
      promptBody: "Draft a thing.",
      userInput: "five defects",
      modelId: "vorion/gpt-4o",
      zodSchema: TestSchema,
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
    });

    const schemaArg = mockCompleteStructured.mock.calls[0]?.[1] as Record<string, unknown>;
    expect(schemaArg.type).toBe("object");
    expect(schemaArg.properties).toMatchObject({ unit: { type: "string" }, count: { type: "number" } });
  });
});
