import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import * as entryProposal from "./entryProposal";
import * as structuredIpc from "../../../ai/structuredIpc";
import { identifySuggestionTargetEntry, proposeEntryEditFromSuggestion } from "./chatEntryEdit";

// `identifySuggestionTargetEntry` goes through `proposeStructuredEntry`,
// whose own internal call to `attemptStructuredProposal` is a same-module
// reference (`entryProposal.ts` calling its own function) — mocking that
// export from the outside cannot intercept it (a real ESM binding, not a
// spy-able property). Mocking `completeStructured` instead — the one true
// IPC boundary both `proposeStructuredEntry` and the direct
// `attemptStructuredProposal` calls below eventually reach — catches both
// call shapes uniformly, the same precedent `mockAudit.test.ts` already set.
vi.mock("../../../ai/structuredIpc", () => ({ completeStructured: vi.fn() }));
const mockedCompleteStructured = vi.mocked(structuredIpc.completeStructured);

vi.mock("./entryProposal", async () => {
  const actual = await vi.importActual<typeof import("./entryProposal")>("./entryProposal");
  return { ...actual, attemptStructuredProposal: vi.fn() };
});

const mockedAttempt = vi.mocked(entryProposal.attemptStructuredProposal);

beforeEach(() => {
  mockedAttempt.mockReset();
  mockedCompleteStructured.mockReset();
});

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

const IDENTITY_RENDERER_MAP: A3EntryRendererMap = {
  "generic-text": (payload, entry) => ({
    lines: [{ text: entry.title, bold: true }, { text: (payload as { text: string }).text }],
  }),
};

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

function seedProject(entries: Record<number, Entry[]> = {}): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const steps = { ...project.steps };
  for (const [stepId, list] of Object.entries(entries)) {
    steps[Number(stepId) as keyof typeof steps] = { entries: list };
  }
  return { ...project, steps };
}

describe("identifySuggestionTargetEntry", () => {
  it("returns noMatch without calling the model when the step has no entries", async () => {
    const result = await identifySuggestionTargetEntry({
      promptBody: "Identify the target entry.",
      suggestionText: "Add a target value.",
      entries: [],
      project: seedProject(),
      rendererMap: IDENTITY_RENDERER_MAP,
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      projectId: "proj-1",
    });

    expect(result).toEqual({ outcome: "noMatch" });
    expect(mockedCompleteStructured).not.toHaveBeenCalled();
  });

  it("returns matched with the real entry id when the model picks a real entry", async () => {
    const entry = makeEntry({ id: "entry-1" });
    mockedCompleteStructured.mockResolvedValueOnce({ targetEntryId: "entry-1" });

    const result = await identifySuggestionTargetEntry({
      promptBody: "Identify the target entry.",
      suggestionText: "Add a target value to this entry.",
      entries: [entry],
      project: seedProject({ 1: [entry] }),
      rendererMap: IDENTITY_RENDERER_MAP,
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      projectId: "proj-1",
    });

    expect(result).toEqual({ outcome: "matched", targetEntryId: "entry-1" });
  });

  it("returns noMatch when the model says the suggestion targets no existing entry", async () => {
    mockedCompleteStructured.mockResolvedValueOnce({ targetEntryId: null });

    const result = await identifySuggestionTargetEntry({
      promptBody: "Identify the target entry.",
      suggestionText: "You should add a whole new fishbone diagram.",
      entries: [makeEntry()],
      project: seedProject(),
      rendererMap: IDENTITY_RENDERER_MAP,
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      projectId: "proj-1",
    });

    expect(result).toEqual({ outcome: "noMatch" });
  });

  it("treats a hallucinated entry id (not in the real list) as noMatch rather than trusting it", async () => {
    mockedCompleteStructured.mockResolvedValueOnce({ targetEntryId: "entry-that-does-not-exist" });

    const result = await identifySuggestionTargetEntry({
      promptBody: "Identify the target entry.",
      suggestionText: "Update this entry.",
      entries: [makeEntry({ id: "entry-1" })],
      project: seedProject(),
      rendererMap: IDENTITY_RENDERER_MAP,
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      projectId: "proj-1",
    });

    expect(result).toEqual({ outcome: "noMatch" });
  });

  it("returns failed after the schema retry is exhausted", async () => {
    // Neither response is valid against `{targetEntryId: string | null}` —
    // this exercises the real `proposeStructuredEntry` schema-retry-once
    // path (through the real `attemptStructuredProposal`, not the mock
    // above, since `proposeStructuredEntry` calls it internally).
    mockedCompleteStructured.mockResolvedValueOnce({ targetEntryId: 123 }).mockResolvedValueOnce({ targetEntryId: 456 });

    const result = await identifySuggestionTargetEntry({
      promptBody: "Identify the target entry.",
      suggestionText: "Update this entry.",
      entries: [makeEntry({ id: "entry-1" })],
      project: seedProject(),
      rendererMap: IDENTITY_RENDERER_MAP,
      modelId: "vorion/gpt-4o",
      redaction: OFF,
      projectId: "proj-1",
    });

    expect(result.outcome).toBe("failed");
    expect(mockedCompleteStructured).toHaveBeenCalledTimes(2);
  });
});

describe("proposeEntryEditFromSuggestion", () => {
  const zodSchema = z.object({ title: z.string(), payload: z.object({ text: z.string() }) });

  it("returns the edited title and payload on the first successful attempt", async () => {
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "Updated title", payload: { text: "Updated body" } },
    });

    const result = await proposeEntryEditFromSuggestion({
      promptBody: "Apply the suggestion.",
      suggestionText: "Add the target value.",
      title: "Original title",
      payload: { text: "Original body" },
      modelId: "vorion/gpt-4o",
      zodSchema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "apply-suggestion.v1",
    });

    expect(result).toEqual({ outcome: "success", title: "Updated title", payload: { text: "Updated body" } });
    expect(mockedAttempt).toHaveBeenCalledTimes(1);
  });

  it("retries once on a schema failure and succeeds on the second attempt", async () => {
    mockedAttempt
      .mockResolvedValueOnce({ success: false, rawText: "bad json", errorSummary: "invalid" })
      .mockResolvedValueOnce({ success: true, value: { title: "Fixed title", payload: { text: "Fixed body" } } });

    const result = await proposeEntryEditFromSuggestion({
      promptBody: "Apply the suggestion.",
      suggestionText: "Add the target value.",
      title: "Original title",
      payload: { text: "Original body" },
      modelId: "vorion/gpt-4o",
      zodSchema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "apply-suggestion.v1",
    });

    expect(result).toEqual({ outcome: "success", title: "Fixed title", payload: { text: "Fixed body" } });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
  });

  it("retries once when the suggestion's own new value is missing from the result, and succeeds", async () => {
    mockedAttempt
      .mockResolvedValueOnce({
        success: true,
        value: { title: "Original title", payload: { text: "Original body, no target added" } },
      })
      .mockResolvedValueOnce({
        success: true,
        value: { title: "Original title", payload: { text: "Original body, target set to %2,0" } },
      });

    const result = await proposeEntryEditFromSuggestion({
      promptBody: "Apply the suggestion.",
      suggestionText: "Set the target to %2,0.",
      title: "Original title",
      payload: { text: "Original body" },
      modelId: "vorion/gpt-4o",
      zodSchema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "apply-suggestion.v1",
    });

    expect(result).toEqual({
      outcome: "success",
      title: "Original title",
      payload: { text: "Original body, target set to %2,0" },
    });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
  });

  it("fails when the second attempt still drops the suggestion's own new value", async () => {
    mockedAttempt
      .mockResolvedValueOnce({ success: true, value: { title: "T", payload: { text: "no target here" } } })
      .mockResolvedValueOnce({ success: true, value: { title: "T", payload: { text: "still no target" } } });

    const result = await proposeEntryEditFromSuggestion({
      promptBody: "Apply the suggestion.",
      suggestionText: "Set the target to %2,0.",
      title: "Original title",
      payload: { text: "Original body" },
      modelId: "vorion/gpt-4o",
      zodSchema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "apply-suggestion.v1",
    });

    expect(result.outcome).toBe("failed");
  });

  it("does not flag content that was already in the original entry, only the suggestion's own new values", async () => {
    // The original entry already contains "%8,3" — the suggestion doesn't
    // mention it at all, so its absence from the result must not trigger a
    // retry (unlike translation, applying a suggestion can legitimately
    // replace old values).
    mockedAttempt.mockResolvedValueOnce({
      success: true,
      value: { title: "T", payload: { text: "Updated: target now %2,0" } },
    });

    const result = await proposeEntryEditFromSuggestion({
      promptBody: "Apply the suggestion.",
      suggestionText: "Set the target to %2,0.",
      title: "T",
      payload: { text: "Current rate %8,3" },
      modelId: "vorion/gpt-4o",
      zodSchema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "apply-suggestion.v1",
    });

    expect(result).toEqual({ outcome: "success", title: "T", payload: { text: "Updated: target now %2,0" } });
    expect(mockedAttempt).toHaveBeenCalledTimes(1);
  });
});
