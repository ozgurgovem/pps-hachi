import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { createNewProject } from "../../../domain/model";
import type { AiMeta, Entry, ProjectModel } from "../../../domain/model";
import { useProjectStore } from "../../../state";
import { TranslateReportPanel } from "./TranslateReportPanel";
import * as entryTranslation from "./entryTranslation";
import type { WholeReportTranslationDiff } from "./entryTranslation";

vi.mock("./entryTranslation", async () => {
  const actual = await vi.importActual<typeof import("./entryTranslation")>("./entryTranslation");
  return { ...actual, buildWholeReportTranslationContext: vi.fn(), proposeWholeReportTranslation: vi.fn() };
});

const mockedBuildContext = vi.mocked(entryTranslation.buildWholeReportTranslationContext);
const mockedPropose = vi.mocked(entryTranslation.proposeWholeReportTranslation);

const initialStoreState = useProjectStore.getState();

function makeEntry(overrides: Partial<Entry> = {}): Entry {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? crypto.randomUUID(),
    methodId: "generic-text",
    title: "A test entry",
    order: 0,
    a3Visibility: "primary",
    payload: { text: "a very long original sentence".repeat(5) },
    images: [],
    createdAt: now,
    updatedAt: now,
    provenance: { origin: "human" },
    ...overrides,
  };
}

function seedProject(aiOverrides: Partial<AiMeta> = {}, entries: Record<number, Entry[]> = {}): ProjectModel {
  const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
  const steps = { ...project.steps };
  for (const [stepId, list] of Object.entries(entries)) {
    steps[Number(stepId) as keyof typeof steps] = { entries: list };
  }
  const withAi: ProjectModel = {
    ...project,
    steps,
    meta: {
      ...project.meta,
      owner: { name: "Ada" },
      ai: { enabled: true, providerId: "vorion", modelId: "vorion/gpt-4o", redaction: {}, ...aiOverrides },
    },
  };
  useProjectStore.setState({ ...initialStoreState, project: withAi });
  return withAi;
}

function renderPanel() {
  return render(
    <MemoryRouter>
      <TranslateReportPanel />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  useProjectStore.setState(initialStoreState, true);
});

describe("TranslateReportPanel", () => {
  it("shows a message and a Settings link when no model is configured for this project", () => {
    seedProject({ modelId: undefined });

    renderPanel();

    expect(screen.getByText("No model is chosen for this project yet.")).toBeTruthy();
    expect(screen.getByRole("link", { name: "Go to Settings" })).toBeTruthy();
  });

  it("calls buildWholeReportTranslationContext and proposeWholeReportTranslation on Analyze, targeting the project's other language", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "the context", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff: { lines: [] }, droppedNotes: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));

    expect(mockedBuildContext).toHaveBeenCalledWith(expect.anything(), "tr");
    expect(await screen.findByText("Nothing to translate.")).toBeTruthy();
    expect(mockedPropose).toHaveBeenCalledWith(
      expect.objectContaining({ contextText: "the context", modelId: "vorion/gpt-4o" }),
    );
  });

  it("shows both notice lists (context truncation and dropped lines) together", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: ["context note"] });
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff: { lines: [] }, droppedNotes: ["line note"] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));

    expect(await screen.findByText("context note")).toBeTruthy();
    expect(screen.getByText("line note")).toBeTruthy();
  });

  it("shows the raw response when the whole-report translation fails", async () => {
    const user = userEvent.setup();
    seedProject();
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    mockedPropose.mockResolvedValueOnce({ outcome: "failed", rawText: "not valid json at all" });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));

    expect(await screen.findByRole("alert")).toBeTruthy();
    expect(screen.getByText("not valid json at all")).toBeTruthy();
  });

  it("renders a checked-by-default title line and applies it via a real dispatch on Apply", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1", title: "Original title" });
    seedProject({}, { 2: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    const diff: WholeReportTranslationDiff = {
      lines: [{ entryId: "e1", field: "title", translatedText: "Çevrilmiş başlık" }],
    };
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff, droppedNotes: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));
    expect(await screen.findByText("Çevrilmiş başlık")).toBeTruthy();
    const checkbox = screen.getByRole("checkbox");
    expect(checkbox).toHaveProperty("ariaChecked", "true");

    await user.click(screen.getByRole("button", { name: "Apply selected" }));

    const updated = useProjectStore.getState().project;
    const updatedEntry = updated?.steps[2]?.entries[0];
    expect(updatedEntry?.title).toBe("Çevrilmiş başlık");
    expect(updatedEntry?.provenance.origin).toBe("ai-accepted");
    expect(updatedEntry?.provenance.model?.providerId).toBe("vorion");
    expect(updatedEntry?.provenance.acceptedBy).toBe("Ada");
    // The project's own language setting is never touched by accepting a line.
    expect(updated?.meta.language).toBe("en");
    expect(await screen.findByText("Applied 1 translated field(s).")).toBeTruthy();
  });

  it("does not apply a line whose checkbox was unchecked", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1", title: "Original title" });
    seedProject({}, { 2: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    const diff: WholeReportTranslationDiff = {
      lines: [{ entryId: "e1", field: "title", translatedText: "Çevrilmiş başlık" }],
    };
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff, droppedNotes: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));
    await screen.findByRole("checkbox");
    await user.click(screen.getByRole("checkbox"));
    await user.click(screen.getByRole("button", { name: "Apply selected" }));

    const updated = useProjectStore.getState().project;
    expect(updated?.steps[2]?.entries[0]?.title).toBe("Original title");
  });

  it("applies an accepted payload-field translation, writing only that field", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1", payload: { text: "x".repeat(200) } });
    seedProject({}, { 1: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    const diff: WholeReportTranslationDiff = {
      lines: [{ entryId: "e1", field: "text", translatedText: "y".repeat(200) }],
    };
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff, droppedNotes: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));
    await screen.findByRole("checkbox");
    await user.click(screen.getByRole("button", { name: "Apply selected" }));

    const updated = useProjectStore.getState().project;
    const updatedEntry = updated?.steps[1]?.entries[0];
    expect((updatedEntry?.payload as { text: string }).text).toBe("y".repeat(200));
    expect(updatedEntry?.title).toBe(entry.title);
  });

  it("rejecting the whole diff returns to idle, applying nothing", async () => {
    const user = userEvent.setup();
    const entry = makeEntry({ id: "e1", title: "Original title" });
    seedProject({}, { 2: [entry] });
    mockedBuildContext.mockReturnValueOnce({ contextText: "ctx", droppedNotes: [] });
    const diff: WholeReportTranslationDiff = {
      lines: [{ entryId: "e1", field: "title", translatedText: "Çevrilmiş başlık" }],
    };
    mockedPropose.mockResolvedValueOnce({ outcome: "success", diff, droppedNotes: [] });

    renderPanel();
    await user.click(screen.getByRole("button", { name: "Translate whole report to Turkish" }));
    await user.click(await screen.findByRole("button", { name: "Reject all" }));

    expect(screen.getByRole("button", { name: "Translate whole report to Turkish" })).toBeTruthy();
    const updated = useProjectStore.getState().project;
    expect(updated?.steps[2]?.entries[0]?.title).toBe("Original title");
  });
});
