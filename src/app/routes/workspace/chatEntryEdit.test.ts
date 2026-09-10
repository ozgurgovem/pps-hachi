import { beforeEach, describe, expect, it, vi } from "vitest";
import { z } from "zod";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import * as structuredIpc from "../../../ai/structuredIpc";
import { identifySuggestionTargetEntry, proposeEntryEditFromSuggestion } from "./chatEntryEdit";

// Both `identifySuggestionTargetEntry` and `proposeEntryEditFromSuggestion`
// go through `proposeStructuredEntry`, whose own internal call to
// `attemptStructuredProposal` is a same-module reference (`entryProposal.ts`
// calling its own function) — mocking that export from the outside cannot
// intercept it (a real ESM binding, not a spy-able property). Mocking
// `completeStructured` instead — the one true IPC boundary every path
// eventually reaches — catches it uniformly, the same precedent
// `mockAudit.test.ts` already set.
vi.mock("../../../ai/structuredIpc", () => ({ completeStructured: vi.fn() }));
const mockedCompleteStructured = vi.mocked(structuredIpc.completeStructured);

beforeEach(() => {
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
    // path (through the real `attemptStructuredProposal`, not mocked
    // directly, since `proposeStructuredEntry` calls it internally).
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
    mockedCompleteStructured.mockResolvedValueOnce({ title: "Updated title", payload: { text: "Updated body" } });

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
    expect(mockedCompleteStructured).toHaveBeenCalledTimes(1);
  });

  it("retries once on a schema failure and succeeds on the second attempt", async () => {
    mockedCompleteStructured
      .mockResolvedValueOnce({ title: 123, payload: { text: "bad shape" } }) // title must be a string
      .mockResolvedValueOnce({ title: "Fixed title", payload: { text: "Fixed body" } });

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
    expect(mockedCompleteStructured).toHaveBeenCalledTimes(2);
  });

  it("fails after the schema retry is exhausted", async () => {
    mockedCompleteStructured
      .mockResolvedValueOnce({ title: 123, payload: { text: "still bad" } })
      .mockResolvedValueOnce({ title: 456, payload: { text: "still bad again" } });

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

    expect(result.outcome).toBe("failed");
    expect(mockedCompleteStructured).toHaveBeenCalledTimes(2);
  });

  // D-249: this reproduces the exact real bug — a verbose, markdown-formatted
  // chat suggestion (headers, bold emphasis, a parenthetical note) whose own
  // section-header phrases ("İyileştirme Önerisi", "Nasıl Olmalı") would have
  // been wrongly flagged as "protected names" by the old, now-removed
  // protected-token check (`layoutReview.ts`'s `NAME_PATTERN` matches any
  // two-or-more-capitalized-word run, headers included), causing the whole
  // feature to fail on nearly every real AI response regardless of whether
  // the actual edit was correct. A single successful structured response
  // must now be accepted outright, with no token-survival check at all.
  it("succeeds on the first attempt for a verbose, markdown-formatted real suggestion (regression)", async () => {
    const suggestionText = [
      "### 2. İyileştirme Önerisi (Nasıl Olmalı?)",
      "",
      "Metnini kurallara tam uyumlu, altı ay sonra okuyan birinin durumu hemen",
      "anlayabileceği **tek cümlelik ideal bir problem tanımı** haline getirelim:",
      "",
      "> **Güncellenmiş Öneri Metni:**",
      '> "BJ Projesi enjeksiyon kalıplarındaki fire oranı W46\'da **%8,3** seviyesine',
      "yükselmiştir (Hedef/Standart: **%X** veya Önceki dönem ortalaması: **%Y**).\"",
      "",
      '*(Not: %8,3 oranının ne ile kıyaslandığını — örneğin şirket hedefi %2,0 ise —',
      'parantez içinde belirtmeniz, aradaki "boşluk"u (gap) net olarak ortaya',
      "koyacaktır.)*",
    ].join("\n");

    mockedCompleteStructured.mockResolvedValueOnce({
      title: "Yüksek Fire Oranı",
      payload: { text: "BJ Projesi enjeksiyon kalıplarındaki fire oranı W46'da %8,3 seviyesine yükselmiştir." },
    });

    const result = await proposeEntryEditFromSuggestion({
      promptBody: "Apply the suggestion.",
      suggestionText,
      title: "Yüksek Fire Oranı",
      payload: { text: "old text" },
      modelId: "vorion/gpt-4o",
      zodSchema,
      redaction: OFF,
      projectId: "proj-1",
      promptVersion: "apply-suggestion.v1",
    });

    expect(result.outcome).toBe("success");
    expect(mockedCompleteStructured).toHaveBeenCalledTimes(1);
  });
});
