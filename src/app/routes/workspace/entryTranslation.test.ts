import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import * as entryProposal from "./entryProposal";
import { buildEntryLookup } from "./layoutReview";
import {
  buildWholeReportTranslationContext,
  otherLanguage,
  proposeEntryTranslation,
  proposeWholeReportTranslation,
} from "./entryTranslation";

vi.mock("./entryProposal", async () => {
  const actual = await vi.importActual<typeof import("./entryProposal")>("./entryProposal");
  return { ...actual, attemptStructuredProposal: vi.fn() };
});

const mockedAttempt = vi.mocked(entryProposal.attemptStructuredProposal);

beforeEach(() => {
  mockedAttempt.mockReset();
});

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };
const EntrySchema = z.object({ text: z.string() });

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    methodId: "generic-text",
    title: "A test entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "short" },
    images: [],
    createdAt: now,
    updatedAt: now,
    provenance: { origin: "human" },
    ...overrides,
  };
}

function seedProject(entries: Record<number, Entry[]>): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const steps = { ...project.steps };
  for (const [stepId, list] of Object.entries(entries)) {
    const numericStepId = Number(stepId) as keyof typeof steps;
    steps[numericStepId] = { entries: list };
  }
  return { ...project, steps };
}

describe("otherLanguage", () => {
  it("returns en for tr and tr for en", () => {
    expect(otherLanguage("tr")).toBe("en");
    expect(otherLanguage("en")).toBe("tr");
  });
});

describe("proposeEntryTranslation", () => {
  it("returns the translated title and payload on the first successful attempt", async () => {
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Translated title", payload: { text: "Translated body" } },
    });

    const result = await proposeEntryTranslation({
      promptBody: "Translate this entry.",
      title: "Original title",
      payload: { text: "Original body" },
      sourceLanguage: "en",
      targetLanguage: "tr",
      modelId: "vorion/gpt-4o",
      zodSchema: z.object({ title: z.string(), payload: EntrySchema }),
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "translate-entry.v1",
    });

    expect(result).toEqual({
      outcome: "success",
      title: "Translated title",
      payload: { text: "Translated body" },
    });
    expect(mockedAttempt).toHaveBeenCalledTimes(1);
  });

  it("retries once when the first attempt fails schema validation, then succeeds", async () => {
    mockedAttempt.mockResolvedValueOnce({ success: false, rawText: "not json", errorSummary: "- payload: required" });
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Translated title", payload: { text: "Translated body" } },
    });

    const result = await proposeEntryTranslation({
      promptBody: "Translate this entry.",
      title: "Original title",
      payload: { text: "Original body" },
      sourceLanguage: "en",
      targetLanguage: "tr",
      modelId: "vorion/gpt-4o",
      zodSchema: z.object({ title: z.string(), payload: EntrySchema }),
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "translate-entry.v1",
    });

    expect(result).toEqual({
      outcome: "success",
      title: "Translated title",
      payload: { text: "Translated body" },
    });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
    const retryPrompt = mockedAttempt.mock.calls[1]?.[0];
    expect(retryPrompt).toContain("Validation errors");
  });

  it("retries once when a protected token is lost, then succeeds", async () => {
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Translated title", payload: { text: "The rate dropped." } },
    });
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Translated title", payload: { text: "The rate dropped to 4,2." } },
    });

    const result = await proposeEntryTranslation({
      promptBody: "Translate this entry.",
      title: "Original title",
      payload: { text: "Oran %4,2 seviyesine düştü." },
      sourceLanguage: "tr",
      targetLanguage: "en",
      modelId: "vorion/gpt-4o",
      zodSchema: z.object({ title: z.string(), payload: EntrySchema }),
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "translate-entry.v1",
    });

    expect(result).toEqual({
      outcome: "success",
      title: "Translated title",
      payload: { text: "The rate dropped to 4,2." },
    });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
    const retryPrompt = mockedAttempt.mock.calls[1]?.[0];
    expect(retryPrompt).toContain("4,2");
  });

  it("fails without writing anything when the second attempt still loses a protected token", async () => {
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Translated title", payload: { text: "The rate dropped." } },
    });
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Translated title", payload: { text: "The rate still dropped." } },
    });

    const result = await proposeEntryTranslation({
      promptBody: "Translate this entry.",
      title: "Original title",
      payload: { text: "Oran %4,2 seviyesine düştü." },
      sourceLanguage: "tr",
      targetLanguage: "en",
      modelId: "vorion/gpt-4o",
      zodSchema: z.object({ title: z.string(), payload: EntrySchema }),
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "translate-entry.v1",
    });

    expect(result.outcome).toBe("failed");
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
  });

  it("returns failed with the raw text after two consecutive schema failures", async () => {
    mockedAttempt.mockResolvedValueOnce({ success: false, rawText: "bad json 1", errorSummary: "err1" });
    mockedAttempt.mockResolvedValueOnce({ success: false, rawText: "bad json 2", errorSummary: "err2" });

    const result = await proposeEntryTranslation({
      promptBody: "Translate this entry.",
      title: "Original title",
      payload: { text: "Original body" },
      sourceLanguage: "en",
      targetLanguage: "tr",
      modelId: "vorion/gpt-4o",
      zodSchema: z.object({ title: z.string(), payload: EntrySchema }),
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "translate-entry.v1",
    });

    expect(result).toEqual({ outcome: "failed", rawText: "bad json 2" });
  });
});

describe("buildWholeReportTranslationContext", () => {
  it("always includes a non-empty title", () => {
    const entry = makeEntry({ title: "Short title", payload: { text: "x" } });
    const project = seedProject({ 1: [entry] });

    const { contextText } = buildWholeReportTranslationContext(project, "tr");

    expect(contextText).toContain("Short title");
    expect(contextText).toContain('field="title"');
  });

  it("includes a payload string field only once it clears the condensable-field minimum length", () => {
    const shortEntry = makeEntry({ id: "short", payload: { text: "too short" } });
    const longEntry = makeEntry({ id: "long", payload: { text: "x".repeat(200) } });
    const project = seedProject({ 1: [shortEntry, longEntry] });

    const { contextText } = buildWholeReportTranslationContext(project, "tr");

    expect(contextText).not.toContain('entryId "short" (method: generic-text) field="text"');
    expect(contextText).toContain('entryId "long" (method: generic-text) field="text"');
  });

  it("notes when fields were left out to fit the context budget", () => {
    const entries = Array.from({ length: 400 }, (_, i) => makeEntry({ id: `e${i}`, payload: { text: "y".repeat(90) } }));
    const project = seedProject({ 1: entries });

    const { droppedNotes } = buildWholeReportTranslationContext(project, "tr");

    expect(droppedNotes.length).toBeGreaterThan(0);
    expect(droppedNotes[0]).toContain("left out");
  });

  it("reports no dropped notes when everything fits", () => {
    const entry = makeEntry({ payload: { text: "x".repeat(200) } });
    const project = seedProject({ 1: [entry] });

    const { droppedNotes } = buildWholeReportTranslationContext(project, "tr");

    expect(droppedNotes).toEqual([]);
  });
});

describe("proposeWholeReportTranslation", () => {
  it("returns success with the diff on the first successful attempt", async () => {
    const entry = makeEntry({ payload: { text: "x".repeat(200) } });
    const project = seedProject({ 1: [entry] });
    const lookup = buildEntryLookup(project);
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { lines: [{ entryId: entry.id, field: "text", translatedText: "y".repeat(200) }] },
    });

    const result = await proposeWholeReportTranslation({
      promptBody: "Translate the report.",
      contextText: "context",
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      lookup,
      projectId: "proj-1",
      promptVersion: "translate-report.v1",
    });

    expect(result.outcome).toBe("success");
    if (result.outcome === "success") {
      expect(result.diff.lines).toHaveLength(1);
      expect(result.droppedNotes).toEqual([]);
    }
    expect(mockedAttempt).toHaveBeenCalledTimes(1);
  });

  it("retries once on schema failure, then succeeds", async () => {
    const entry = makeEntry({ payload: { text: "x".repeat(200) } });
    const project = seedProject({ 1: [entry] });
    const lookup = buildEntryLookup(project);
    mockedAttempt.mockResolvedValueOnce({ success: false, rawText: "bad", errorSummary: "err" });
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { lines: [{ entryId: entry.id, field: "text", translatedText: "y".repeat(200) }] },
    });

    const result = await proposeWholeReportTranslation({
      promptBody: "Translate the report.",
      contextText: "context",
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      lookup,
      projectId: "proj-1",
      promptVersion: "translate-report.v1",
    });

    expect(result.outcome).toBe("success");
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
  });

  it("drops only the line that still loses a protected token after the retry, keeping the rest", async () => {
    const withNumber = makeEntry({ id: "with-number", payload: { text: `${"a".repeat(90)} 4,2 ${"b".repeat(90)}` } });
    const plain = makeEntry({ id: "plain", payload: { text: "c".repeat(200) } });
    const project = seedProject({ 1: [withNumber, plain] });
    const lookup = buildEntryLookup(project);

    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: {
        lines: [
          { entryId: "with-number", field: "text", translatedText: "the number is gone now" },
          { entryId: "plain", field: "text", translatedText: "d".repeat(200) },
        ],
      },
    });
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: {
        lines: [
          { entryId: "with-number", field: "text", translatedText: "still no number here" },
          { entryId: "plain", field: "text", translatedText: "d".repeat(200) },
        ],
      },
    });

    const result = await proposeWholeReportTranslation({
      promptBody: "Translate the report.",
      contextText: "context",
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      lookup,
      projectId: "proj-1",
      promptVersion: "translate-report.v1",
    });

    expect(result.outcome).toBe("success");
    if (result.outcome === "success") {
      expect(result.diff.lines).toEqual([{ entryId: "plain", field: "text", translatedText: "d".repeat(200) }]);
      expect(result.droppedNotes).toHaveLength(1);
      expect(result.droppedNotes[0]).toContain("with-number");
    }
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
  });
});
