import { describe, expect, it } from "vitest";
import type { A3EntryRendererMap } from "../../../a3/methodContract";
import { createNewProject } from "../../../domain/model";
import type { Entry, ProjectModel } from "../../../domain/model";
import i18next from "../../../i18n";
import { getCoachingMarkdown } from "./coachContent";
import { buildStepAssistantPrompt } from "./stepAiContext";

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

function seedProject(entries: Record<number, Entry[]> = {}, language: "tr" | "en" = "en"): ProjectModel {
  const { project } = createNewProject({ title: "T", language, appVersion: "0.1.0" });
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

describe("buildStepAssistantPrompt", () => {
  it("embeds the step's real coaching content", () => {
    const project = seedProject();
    const prompt = buildStepAssistantPrompt(
      4,
      "en",
      i18next.t,
      "How do I verify a root cause?",
      project,
      IDENTITY_RENDERER_MAP,
    );

    expect(prompt).toContain(getCoachingMarkdown("en", 4).trim());
  });

  it("embeds the step's own question", () => {
    const project = seedProject();
    const prompt = buildStepAssistantPrompt(
      4,
      "en",
      i18next.t,
      "How do I verify a root cause?",
      project,
      IDENTITY_RENDERER_MAP,
    );

    expect(prompt).toContain("How do I verify a root cause?");
  });

  it("lists the methods available in that step by their real localized name", () => {
    const project = seedProject();
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "hi", project, IDENTITY_RENDERER_MAP);

    expect(prompt).toContain("Fishbone (Ishikawa)");
    expect(prompt).toContain("5 Why");
  });

  it("switches labels to Turkish when the language is tr", () => {
    const project = seedProject();
    const prompt = buildStepAssistantPrompt(
      4,
      "tr",
      i18next.t,
      "Kök nedeni nasıl doğrularım?",
      project,
      IDENTITY_RENDERER_MAP,
    );

    expect(prompt).toContain(getCoachingMarkdown("tr", 4).trim());
    expect(prompt).toContain("Bu adımda kullanılabilecek yöntemler");
    expect(prompt).toContain("Kullanıcının sorusu: Kök nedeni nasıl doğrularım?");
  });

  it("produces a longer prompt than the raw question alone", () => {
    const project = seedProject();
    const question = "short question";
    const prompt = buildStepAssistantPrompt(2, "en", i18next.t, question, project, IDENTITY_RENDERER_MAP);

    expect(prompt.length).toBeGreaterThan(question.length);
  });

  // D-246 (Barış's own real-use report): the AI used to have no visibility
  // at all into the user's own entered data for the step, so its answers
  // asked the user to paste data it could already have read.
  it("tells the model explicitly when this step has no entries yet, rather than omitting the section", () => {
    const project = seedProject();
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "hi", project, IDENTITY_RENDERER_MAP);

    expect(prompt).toContain("This step's own entries");
    expect(prompt).toContain("No entries have been added to this step yet.");
  });

  it("embeds a real summary of every entry already in this step", () => {
    const project = seedProject({
      4: [makeEntry({ title: "Fishbone: worn fixture", payload: { text: "The fixture on line 3 is worn." } })],
    });
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "hi", project, IDENTITY_RENDERER_MAP);

    expect(prompt).toContain("Fishbone: worn fixture");
    expect(prompt).toContain("The fixture on line 3 is worn.");
    expect(prompt).not.toContain("No entries have been added to this step yet.");
  });

  it("renders entry summaries in the project's own content language (D-43), independent of the UI language passed for coaching text", () => {
    // The prompt's own `language` argument is "en" (coaching stays in
    // English) while the project's content language is "tr" — a real
    // instance of the exact split P-42 got wrong once before: entry
    // rendering must follow `project.meta.language`, never the UI language.
    const project = seedProject(
      { 4: [makeEntry({ title: "Balık kılçığı", payload: { text: "Sabit aparat aşınmış." } })] },
      "tr",
    );
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "hi", project, IDENTITY_RENDERER_MAP);

    expect(prompt).toContain("Balık kılçığı");
    expect(prompt).toContain("Sabit aparat aşınmış.");
  });

  it("only ever includes entries from the requested step, not other steps'", () => {
    const project = seedProject({
      2: [makeEntry({ title: "Step 2 entry", payload: { text: "belongs to step 2" } })],
      4: [makeEntry({ title: "Step 4 entry", payload: { text: "belongs to step 4" } })],
    });
    const prompt = buildStepAssistantPrompt(4, "en", i18next.t, "hi", project, IDENTITY_RENDERER_MAP);

    expect(prompt).toContain("Step 4 entry");
    expect(prompt).not.toContain("Step 2 entry");
  });
});
