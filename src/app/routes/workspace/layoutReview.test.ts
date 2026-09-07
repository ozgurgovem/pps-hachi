import { beforeEach, describe, expect, it, vi } from "vitest";
import type { A3LayoutDescriptor, OverflowWarning } from "../../../a3/descriptor";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import * as entryProposal from "./entryProposal";
import {
  buildEntryLookup,
  buildLayoutReviewContext,
  collectCondensableFields,
  extractProtectedTokens,
  findMissingProtectedTokens,
  lookupCondensableText,
  proposeLayoutReviewDiff,
  type LayoutReviewDiff,
} from "./layoutReview";

vi.mock("./entryProposal", async () => {
  const actual = await vi.importActual<typeof import("./entryProposal")>("./entryProposal");
  return { ...actual, attemptStructuredProposal: vi.fn() };
});

const mockedAttempt = vi.mocked(entryProposal.attemptStructuredProposal);

beforeEach(() => {
  mockedAttempt.mockReset();
});

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

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

const EMPTY_DESCRIPTOR_BASE: Pick<A3LayoutDescriptor, "templateId" | "language" | "styles" | "sheets" | "provisionalBlocks"> = {
  templateId: "farplas-7step-tr",
  language: "en",
  styles: [],
  sheets: { a3: {} as A3LayoutDescriptor["sheets"]["a3"], appendices: [] },
  provisionalBlocks: [],
};

function descriptorWithWarnings(overflowWarnings: readonly OverflowWarning[]): A3LayoutDescriptor {
  return { ...EMPTY_DESCRIPTOR_BASE, overflowWarnings };
}

const IDENTITY_RENDERER_MAP: A3EntryRendererMap = {
  "generic-text": (payload, entry) => ({
    lines: [{ text: entry.title, bold: true }, { text: (payload as { text: string }).text }],
  }),
};

describe("extractProtectedTokens", () => {
  it("captures a percentage with a comma decimal separator", () => {
    expect(extractProtectedTokens("Fire oranı %4,2 seviyesinde.")).toContain("4,2");
  });

  it("captures a numeric date in dd.mm.yyyy form", () => {
    expect(extractProtectedTokens("Signed on 10.08.2026 by the team.")).toContain("10.08.2026");
  });

  it("captures a named date in Turkish", () => {
    expect(extractProtectedTokens("Hedef 5 Ocak 2026 tarihine kadar.")).toContain("5 Ocak 2026");
  });

  it("captures a named date in English", () => {
    expect(extractProtectedTokens("Due by January 5, 2026 at the latest.")).toContain("January 5, 2026");
  });

  it("captures a part-number-like alphanumeric token", () => {
    expect(extractProtectedTokens("Part AB-1234 failed inspection.")).toContain("AB-1234");
  });

  it("captures a two-word capitalized name", () => {
    expect(extractProtectedTokens("Reported by Ahmet Yilmaz on the line.")).toContain("Ahmet Yilmaz");
  });

  it("finds nothing in plain prose with no protected content", () => {
    expect(extractProtectedTokens("the team reviewed the process and agreed")).toEqual([]);
  });
});

describe("findMissingProtectedTokens", () => {
  it("returns empty when every protected token survives", () => {
    const original = "Fire oranı %4,2, tarih 10.08.2026.";
    const condensed = "Fire %4,2, 10.08.2026'da.";

    expect(findMissingProtectedTokens(original, condensed)).toEqual([]);
  });

  it("reports a dropped number", () => {
    const original = "Fire oranı %4,2 seviyesinde tespit edildi.";
    const condensed = "Fire oranı tespit edildi.";

    expect(findMissingProtectedTokens(original, condensed)).toContain("4,2");
  });

  it("reports a dropped part number", () => {
    const original = "Part AB-1234 was scrapped.";
    const condensed = "The part was scrapped.";

    expect(findMissingProtectedTokens(original, condensed)).toContain("AB-1234");
  });
});

describe("collectCondensableFields", () => {
  it("always includes a non-empty title", () => {
    const entry = makeEntry({ title: "Short title", payload: { text: "x" } });

    const fields = collectCondensableFields(entry);

    expect(fields).toEqual(expect.arrayContaining([{ field: "title", text: "Short title" }]));
  });

  it("includes a payload string field only once it clears the minimum length", () => {
    const shortEntry = makeEntry({ payload: { text: "too short" } });
    const longEntry = makeEntry({ payload: { text: "x".repeat(200) } });

    expect(collectCondensableFields(shortEntry).some((f) => f.field === "text")).toBe(false);
    expect(collectCondensableFields(longEntry).some((f) => f.field === "text")).toBe(true);
  });

  it("ignores non-string and non-object payloads", () => {
    const entry = makeEntry({ payload: "just a string, not an object" });

    expect(collectCondensableFields(entry)).toEqual([{ field: "title", text: entry.title }]);
  });
});

describe("buildEntryLookup / lookupCondensableText", () => {
  it("resolves an entry's title and a payload field by id", () => {
    const entry = makeEntry({ id: "e1", title: "Gap statement", payload: { actual: "x".repeat(100) } });
    const project = seedProject({ 1: [entry] });

    const lookup = buildEntryLookup(project);

    expect(lookup.get("e1")?.stepId).toBe(1);
    expect(lookupCondensableText(lookup, "e1", "title")).toBe("Gap statement");
    expect(lookupCondensableText(lookup, "e1", "actual")).toBe("x".repeat(100));
    expect(lookupCondensableText(lookup, "e1", "no-such-field")).toBeUndefined();
    expect(lookupCondensableText(lookup, "does-not-exist", "title")).toBeUndefined();
  });
});

describe("buildLayoutReviewContext", () => {
  it("lists every entry with its step, method and visibility", () => {
    const project = seedProject({
      1: [makeEntry({ id: "e1", title: "Problem statement" })],
      2: [makeEntry({ id: "e2", title: "Pareto", a3Visibility: "appendix" })],
    });

    const { contextText } = buildLayoutReviewContext(project, descriptorWithWarnings([]), IDENTITY_RENDERER_MAP);

    expect(contextText).toContain('entryId "e1"');
    expect(contextText).toContain("visibility: primary");
    expect(contextText).toContain('entryId "e2"');
    expect(contextText).toContain("visibility: appendix");
  });

  it("reports an over-budget block using buildA3Layout's own overflow data, not a recomputed value", () => {
    const project = seedProject({ 2: [makeEntry({ id: "e2" })] });
    const descriptor = descriptorWithWarnings([
      { stepIds: [2], budgetPt: 100, contentPt: 150, overflowByPt: 50, droppedEntryIds: ["e-dropped"] },
    ]);

    const { contextText } = buildLayoutReviewContext(project, descriptor, IDENTITY_RENDERER_MAP);

    expect(contextText).toContain("over its printed budget by 50pt");
    expect(contextText).toContain("e-dropped");
  });

  it("only lists condensable content for primary entries inside an over-budget block", () => {
    const overBudgetEntry = makeEntry({ id: "e-over", payload: { text: "x".repeat(200) } });
    const fittingEntry = makeEntry({ id: "e-fits", payload: { text: "x".repeat(200) } });
    const appendixInOverBudget = makeEntry({
      id: "e-appendix",
      a3Visibility: "appendix",
      payload: { text: "x".repeat(200) },
    });
    const project = seedProject({ 2: [overBudgetEntry, appendixInOverBudget], 3: [fittingEntry] });
    const descriptor = descriptorWithWarnings([
      { stepIds: [2], budgetPt: 100, contentPt: 150, overflowByPt: 50, droppedEntryIds: [] },
    ]);

    const { contextText } = buildLayoutReviewContext(project, descriptor, IDENTITY_RENDERER_MAP);

    expect(contextText).toContain('entryId "e-over"');
    expect(contextText).not.toContain('entryId "e-fits" (Step 3, method');
    expect(contextText).not.toContain('entryId "e-appendix" (Step 2, method');
  });

  it("drops hidden entries' content summaries first when the context is too large, and says so", () => {
    const hugeEntries = Array.from({ length: 100 }, (_, i) =>
      makeEntry({ id: `hidden-${i}`, a3Visibility: "hidden", payload: { text: "x".repeat(1000) } }),
    );
    const project = seedProject({ 1: hugeEntries });

    const { contextText, droppedNotes } = buildLayoutReviewContext(
      project,
      descriptorWithWarnings([]),
      IDENTITY_RENDERER_MAP,
    );

    expect(droppedNotes.length).toBeGreaterThan(0);
    expect(droppedNotes[0]).toContain("hidden");
    expect(contextText.length).toBeLessThanOrEqual(20000);
  });
});

const SCHEMA_VALID_EMPTY_DIFF: LayoutReviewDiff = { visibilityChanges: [], textCondensations: [] };

function successAttempt(value: unknown) {
  return { success: true as const, value };
}

function failedAttempt(rawText: string, errorSummary: string) {
  return { success: false as const, rawText, errorSummary };
}

describe("proposeLayoutReviewDiff", () => {
  const baseParams = {
    promptBody: "Review the layout.",
    contextText: "entry data here",
    modelId: "vorion/gpt-4o",
    redaction: OFF,
    projectId: "proj-1",
    promptVersion: "layout-review.v1",
  };

  it("returns success on the first attempt when the schema is valid and no protected token is lost", async () => {
    mockedAttempt.mockResolvedValueOnce(successAttempt(SCHEMA_VALID_EMPTY_DIFF));

    const result = await proposeLayoutReviewDiff({ ...baseParams, lookup: new Map() });

    expect(result).toEqual({ outcome: "success", diff: SCHEMA_VALID_EMPTY_DIFF, droppedNotes: [] });
    expect(mockedAttempt).toHaveBeenCalledTimes(1);
  });

  it("retries once with schema errors appended when the first attempt is not schema-valid", async () => {
    mockedAttempt.mockResolvedValueOnce(failedAttempt("not json", "bad shape"));
    mockedAttempt.mockResolvedValueOnce(successAttempt(SCHEMA_VALID_EMPTY_DIFF));

    const result = await proposeLayoutReviewDiff({ ...baseParams, lookup: new Map() });

    expect(result).toEqual({ outcome: "success", diff: SCHEMA_VALID_EMPTY_DIFF, droppedNotes: [] });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
    const retryPrompt = mockedAttempt.mock.calls[1]?.[0] as string;
    expect(retryPrompt).toContain("bad shape");
  });

  it("returns failed after two consecutive schema failures", async () => {
    mockedAttempt.mockResolvedValueOnce(failedAttempt("still not json", "bad shape"));
    mockedAttempt.mockResolvedValueOnce(failedAttempt("still not json", "bad shape again"));

    const result = await proposeLayoutReviewDiff({ ...baseParams, lookup: new Map() });

    expect(result).toEqual({ outcome: "failed", rawText: "still not json" });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
  });

  it("retries once, appending which protected token was lost, when a condensation drops one", async () => {
    const entry = makeEntry({ id: "e1", payload: { actual: "Fire oranı %4,2 seviyesinde." } });
    const project = seedProject({ 1: [entry] });
    const lookup = buildEntryLookup(project);

    const badDiff: LayoutReviewDiff = {
      visibilityChanges: [],
      textCondensations: [{ entryId: "e1", field: "actual", condensedText: "Fire oranı yüksek.", reason: "shorter" }],
    };
    const goodDiff: LayoutReviewDiff = {
      visibilityChanges: [],
      textCondensations: [{ entryId: "e1", field: "actual", condensedText: "Fire %4,2.", reason: "shorter" }],
    };
    mockedAttempt.mockResolvedValueOnce(successAttempt(badDiff));
    mockedAttempt.mockResolvedValueOnce(successAttempt(goodDiff));

    const result = await proposeLayoutReviewDiff({ ...baseParams, lookup });

    expect(result).toEqual({ outcome: "success", diff: goodDiff, droppedNotes: [] });
    expect(mockedAttempt).toHaveBeenCalledTimes(2);
    const retryPrompt = mockedAttempt.mock.calls[1]?.[0] as string;
    expect(retryPrompt).toContain("4,2");
  });

  it("drops only the still-failing line after a second protected-token failure, keeping the rest of the diff", async () => {
    const entryA = makeEntry({ id: "eA", payload: { actual: "Fire oranı %4,2 seviyesinde." } });
    const entryB = makeEntry({ id: "eB", payload: { actual: "Confirmed by Ahmet Yilmaz for the batch." } });
    const project = seedProject({ 1: [entryA, entryB] });
    const lookup = buildEntryLookup(project);

    const firstDiff: LayoutReviewDiff = {
      visibilityChanges: [],
      textCondensations: [
        { entryId: "eA", field: "actual", condensedText: "Fire high.", reason: "shorter" },
        { entryId: "eB", field: "actual", condensedText: "Confirmed for the batch.", reason: "shorter" },
      ],
    };
    // Retry keeps eA still lossy, but fixes eB.
    const retryDiff: LayoutReviewDiff = {
      visibilityChanges: [],
      textCondensations: [
        { entryId: "eA", field: "actual", condensedText: "Fire high, still.", reason: "shorter" },
        { entryId: "eB", field: "actual", condensedText: "Ahmet Yilmaz confirmed the batch.", reason: "shorter" },
      ],
    };
    mockedAttempt.mockResolvedValueOnce(successAttempt(firstDiff));
    mockedAttempt.mockResolvedValueOnce(successAttempt(retryDiff));

    const result = await proposeLayoutReviewDiff({ ...baseParams, lookup });

    expect(result.outcome).toBe("success");
    if (result.outcome !== "success") throw new Error("unreachable");
    expect(result.diff.textCondensations).toEqual([
      { entryId: "eB", field: "actual", condensedText: "Ahmet Yilmaz confirmed the batch.", reason: "shorter" },
    ]);
    expect(result.droppedNotes.length).toBe(1);
    expect(result.droppedNotes[0]).toContain("eA");
  });

  it("forwards the redaction policy on every attempt", async () => {
    mockedAttempt.mockResolvedValueOnce(successAttempt(SCHEMA_VALID_EMPTY_DIFF));
    const redaction: ResolvedRedactionPolicy = { mode: "customers", terms: ["Acme"], preserveNumbers: true };

    await proposeLayoutReviewDiff({ ...baseParams, redaction, lookup: new Map() });

    expect(mockedAttempt.mock.calls[0]?.[4]).toEqual(redaction);
  });
});
