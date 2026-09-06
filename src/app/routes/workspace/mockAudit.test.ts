import { beforeEach, describe, expect, it, vi } from "vitest";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import type { ResolvedRedactionPolicy } from "../../../ai/redaction";
import { getWholeProjectPromptFile } from "../../../ai/prompts/wholeProjectLibrary";
import { completeStructured } from "../../../ai/structuredIpc";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import { buildMockAuditContext, MockAuditFindingSchema, MockAuditResultSchema, proposeMockAuditFindings } from "./mockAudit";

vi.mock("../../../ai/structuredIpc", () => ({
  completeStructured: vi.fn(),
}));

const mockCompleteStructured = vi.mocked(completeStructured);

beforeEach(() => {
  mockCompleteStructured.mockReset();
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
    steps[Number(stepId) as keyof typeof steps] = { entries: list };
  }
  return { ...project, steps };
}

const IDENTITY_RENDERER_MAP: A3EntryRendererMap = {
  "generic-text": (payload, entry) => ({
    lines: [{ text: entry.title, bold: true }, { text: (payload as { text: string }).text }],
  }),
};

describe("MockAuditFindingSchema / MockAuditResultSchema", () => {
  it("accepts a well-formed finding", () => {
    const finding = { stepId: 4, severity: "major", category: "person-blamed-root-cause", message: "..." };
    expect(MockAuditFindingSchema.safeParse(finding).success).toBe(true);
    expect(MockAuditResultSchema.safeParse({ findings: [finding] }).success).toBe(true);
  });

  it("rejects an out-of-range stepId", () => {
    expect(
      MockAuditFindingSchema.safeParse({ stepId: 9, severity: "minor", category: "x", message: "y" }).success,
    ).toBe(false);
  });

  it("rejects a severity outside minor/major", () => {
    expect(
      MockAuditFindingSchema.safeParse({ stepId: 1, severity: "critical", category: "x", message: "y" }).success,
    ).toBe(false);
  });

  it("accepts an empty findings list", () => {
    expect(MockAuditResultSchema.safeParse({ findings: [] }).success).toBe(true);
  });
});

describe("buildMockAuditContext", () => {
  it("lists every entry across every step with its summary", () => {
    const project = seedProject({
      1: [makeEntry({ title: "Problem statement", payload: { text: "gap not quantified" } })],
      6: [makeEntry({ title: "Action item", payload: { text: "no owner set" } })],
    });

    const { contextText } = buildMockAuditContext(project, IDENTITY_RENDERER_MAP);

    expect(contextText).toContain("Step 1");
    expect(contextText).toContain("Problem statement");
    expect(contextText).toContain("Step 6");
    expect(contextText).toContain("Action item");
  });

  it("reports no entries when the project is empty", () => {
    const project = seedProject({});
    const { contextText } = buildMockAuditContext(project, IDENTITY_RENDERER_MAP);
    expect(contextText).toBe("(no entries yet)");
  });

  it("§8.14: drops hidden entries' content summaries first when the context is too large, with a visible note", () => {
    const manyHiddenEntries = Array.from({ length: 100 }, (_, index) =>
      makeEntry({ id: `hidden-${index}`, a3Visibility: "hidden", payload: { text: "x".repeat(1000) } }),
    );
    const project = seedProject({ 1: manyHiddenEntries });

    const { contextText, droppedNotes } = buildMockAuditContext(project, IDENTITY_RENDERER_MAP);

    expect(droppedNotes.length).toBeGreaterThan(0);
    expect(droppedNotes[0]).toContain("hidden");
    expect(contextText.length).toBeLessThanOrEqual(20000);
  });
});

describe("SPEC.md §1.2 S1-S8 categories appear in the mock-audit prompt body (§2.8 done-criterion)", () => {
  const promptFile = getWholeProjectPromptFile("mock-audit", "v1");

  it("finds the real prompt file", () => {
    expect(promptFile).toBeDefined();
  });

  const s1ThroughS8Phrases = [
    "S1", // gap quantified
    "S2", // data-based entry / point of cause
    "S3", // SMART target
    "S4", // verified root cause
    "S5", // countermeasure linked to root cause / error-proofing hierarchy
    "S6", // owner / due date
    "S7", // process-confirmation
    "S8", // document updated / read-across
  ];

  it.each(s1ThroughS8Phrases)("mentions %s explicitly, so the AI is told not to repeat it", (phrase) => {
    expect(promptFile?.body).toContain(phrase);
  });

  it("names P-46's person-blamed-root-cause category as a genuinely new thing to look for", () => {
    expect(promptFile?.body.toLowerCase()).toContain("operator error");
    expect(promptFile?.body).toContain("blames");
  });
});

describe("proposeMockAuditFindings", () => {
  it("returns findings on a schema-valid first response", async () => {
    mockCompleteStructured.mockResolvedValueOnce({
      findings: [{ stepId: 4, severity: "major", category: "person-blamed-root-cause", message: "..." }],
    });

    const result = await proposeMockAuditFindings({
      promptBody: "Audit this report.",
      contextText: "Step 4 — ...",
      modelId: "vorion/gpt-4o",
      redaction: OFF,
    });

    expect(result.outcome).toBe("success");
    if (result.outcome === "success") {
      expect(result.findings).toHaveLength(1);
      expect(result.findings[0]?.category).toBe("person-blamed-root-cause");
    }
    expect(mockCompleteStructured).toHaveBeenCalledTimes(1);
  });

  it("retries once on a schema-invalid first response, per §8.7's retry-once discipline", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ findings: [{ stepId: 4, severity: "major" }] }); // missing category/message
    mockCompleteStructured.mockResolvedValueOnce({ findings: [] });

    const result = await proposeMockAuditFindings({
      promptBody: "Audit this report.",
      contextText: "Step 4 — ...",
      modelId: "vorion/gpt-4o",
      redaction: OFF,
    });

    expect(result.outcome).toBe("success");
    expect(mockCompleteStructured).toHaveBeenCalledTimes(2);
  });

  it("surfaces the raw response as failed after a second invalid attempt — nothing is written, there is nothing to write", async () => {
    mockCompleteStructured.mockResolvedValueOnce({ findings: "not an array" });
    mockCompleteStructured.mockResolvedValueOnce({ findings: "still not an array" });

    const result = await proposeMockAuditFindings({
      promptBody: "Audit this report.",
      contextText: "Step 4 — ...",
      modelId: "vorion/gpt-4o",
      redaction: OFF,
    });

    expect(result.outcome).toBe("failed");
  });
});
