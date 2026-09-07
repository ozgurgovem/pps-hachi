import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { SettingsScreen } from "./SettingsScreen";
import * as settingsIpc from "../../../ai/settingsIpc";
import { createNewProject } from "../../../domain/model";
import { useProjectStore } from "../../../state";

vi.mock("../../../ai/settingsIpc");

const mocked = vi.mocked(settingsIpc);
const initialProjectStoreState = useProjectStore.getState();

const EMPTY_SETTINGS: settingsIpc.AiSettings = {
  enabled: false,
  defaultModelId: null,
  fastModelId: null,
  spendCapUsd: null,
};

function renderSettingsScreen() {
  return render(
    <MemoryRouter initialEntries={["/settings"]}>
      <SettingsScreen />
    </MemoryRouter>,
  );
}

afterEach(() => {
  vi.clearAllMocks();
  useProjectStore.setState(initialProjectStoreState, true);
});

describe("SettingsScreen", () => {
  test("shows the not-connected state and an API key field when no key is configured", async () => {
    mocked.getKeyStatus.mockResolvedValueOnce(null);
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

    renderSettingsScreen();

    expect(await screen.findByText("Not connected")).toBeTruthy();
    expect(screen.getByLabelText("API key")).toBeTruthy();
    expect(mocked.listModels).not.toHaveBeenCalled();
  });

  test("saving a key stores it, shows only the masked preview, and never renders the raw key", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce(null);
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);
    mocked.setApiKey.mockResolvedValueOnce("nk_live_…d41d");
    mocked.listModels.mockResolvedValueOnce([]);
    const rawKey = "nk_live_this_is_a_fake_test_only_key";

    renderSettingsScreen();
    await screen.findByLabelText("API key");

    await user.type(screen.getByLabelText("API key"), rawKey);
    await user.click(screen.getByRole("button", { name: "Save key" }));

    expect(await screen.findByText("nk_live_…d41d")).toBeTruthy();
    expect(mocked.setApiKey).toHaveBeenCalledWith(rawKey);
    expect(document.body.textContent).not.toContain(rawKey);
    // The paste field itself must also be gone — not just masked over.
    expect(screen.queryByDisplayValue(rawKey)).toBeNull();
  });

  test("loads models once a key is already configured and populates the default-model selector", async () => {
    mocked.getKeyStatus.mockResolvedValueOnce("nk_live_…d41d");
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);
    mocked.listModels.mockResolvedValueOnce([
      { id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" },
      { id: "vorion/vorion-default", name: "Vorion Default", provider: "vorion" },
    ]);

    renderSettingsScreen();

    await waitFor(() => expect(mocked.listModels).toHaveBeenCalled());
    expect(await screen.findByLabelText("Default model")).toBeTruthy();
  });

  test("selecting a default model persists it via setAiSettings", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce("nk_live_…d41d");
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);
    mocked.listModels.mockResolvedValueOnce([{ id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" }]);
    mocked.setAiSettings.mockResolvedValueOnce(undefined);

    renderSettingsScreen();
    await screen.findByLabelText("Default model");

    await user.click(screen.getByLabelText("Default model"));
    await user.click(await screen.findByRole("option", { name: "GPT-4o" }));

    await waitFor(() =>
      expect(mocked.setAiSettings).toHaveBeenCalledWith(
        expect.objectContaining({ defaultModelId: "openai/gpt-4o" }),
      ),
    );
  });

  test("test connection reports a successful result with latency", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce("nk_live_…d41d");
    mocked.getAiSettings.mockResolvedValueOnce({ ...EMPTY_SETTINGS, defaultModelId: "openai/gpt-4o" });
    mocked.listModels.mockResolvedValueOnce([{ id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" }]);
    mocked.testConnection.mockResolvedValueOnce({ success: true, latencyMs: 512, error: null });

    renderSettingsScreen();
    await screen.findByRole("button", { name: "Test connection" });

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(mocked.testConnection).toHaveBeenCalledWith("openai/gpt-4o");
    expect(await screen.findByText("Connected — 512 ms")).toBeTruthy();
  });

  test("test connection reports the provider's error verbatim", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce("nk_live_…d41d");
    mocked.getAiSettings.mockResolvedValueOnce({ ...EMPTY_SETTINGS, defaultModelId: "openai/gpt-4o" });
    mocked.listModels.mockResolvedValueOnce([{ id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" }]);
    mocked.testConnection.mockResolvedValueOnce({
      success: false,
      latencyMs: 210,
      error: "429: quota exceeded",
    });

    renderSettingsScreen();
    await screen.findByRole("button", { name: "Test connection" });

    await user.click(screen.getByRole("button", { name: "Test connection" }));

    expect(await screen.findByText("Error: 429: quota exceeded")).toBeTruthy();
  });

  test("removing the key resets to the not-connected state", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce("nk_live_…d41d");
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);
    mocked.listModels.mockResolvedValueOnce([]);
    mocked.removeApiKey.mockResolvedValueOnce(undefined);

    renderSettingsScreen();
    await screen.findByRole("button", { name: "Remove key" });

    await user.click(screen.getByRole("button", { name: "Remove key" }));

    expect(mocked.removeApiKey).toHaveBeenCalled();
    expect(await screen.findByText("Not connected")).toBeTruthy();
  });

  test("a configured key can be replaced directly, without removing it first", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce("nk_live_…d41d");
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);
    mocked.listModels.mockResolvedValue([]);
    mocked.setApiKey.mockResolvedValueOnce("nk_live_…9999");
    const newKey = "nk_live_another_fake_test_only_key";

    renderSettingsScreen();
    // SPEC.md §8.3: "Re-entry replaces; there is no reveal" — the paste
    // field is present alongside the masked value, with no need to click
    // "Remove key" first.
    await screen.findByText("nk_live_…d41d");

    await user.type(screen.getByLabelText("API key"), newKey);
    await user.click(screen.getByRole("button", { name: "Save key" }));

    expect(mocked.setApiKey).toHaveBeenCalledWith(newKey);
    expect(mocked.removeApiKey).not.toHaveBeenCalled();
    expect(await screen.findByText("nk_live_…9999")).toBeTruthy();
  });

  test("toggling enable AI assistance persists the setting", async () => {
    const user = userEvent.setup();
    mocked.getKeyStatus.mockResolvedValueOnce(null);
    mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);
    mocked.setAiSettings.mockResolvedValueOnce(undefined);

    renderSettingsScreen();
    await screen.findByLabelText("Enable AI assistance");

    await user.click(screen.getByLabelText("Enable AI assistance"));

    expect(mocked.setAiSettings).toHaveBeenCalledWith(expect.objectContaining({ enabled: true }));
  });

  describe("debug: enable AI for the open project (D-201)", () => {
    test("shows a message instead of the toggle when no project is open", async () => {
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByText("Open a project first.")).toBeTruthy();
      expect(screen.queryByRole("checkbox", { name: "Enable AI for the open project" })).toBeNull();
    });

    test("shows the toggle unchecked for an open project with AI not yet enabled", async () => {
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      const toggle = await screen.findByRole("checkbox", { name: "Enable AI for the open project" });
      expect(toggle.getAttribute("aria-checked")).toBe("false");
    });

    test("checking the toggle sets meta.ai.enabled/providerId on the open project", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();
      await screen.findByRole("checkbox", { name: "Enable AI for the open project" });

      await user.click(screen.getByRole("checkbox", { name: "Enable AI for the open project" }));

      const updated = useProjectStore.getState().project;
      expect(updated?.meta.ai.enabled).toBe(true);
      expect(updated?.meta.ai.providerId).toBe("vorion");
    });

    test("falls back to the global default model when the project has none set yet", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce({ ...EMPTY_SETTINGS, defaultModelId: "openai/gpt-4o" });

      renderSettingsScreen();
      await screen.findByRole("checkbox", { name: "Enable AI for the open project" });

      await user.click(screen.getByRole("checkbox", { name: "Enable AI for the open project" }));

      expect(useProjectStore.getState().project?.meta.ai.modelId).toBe("openai/gpt-4o");
    });

    test("never overwrites a model the project already has chosen", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      const withModel = { ...project, meta: { ...project.meta, ai: { ...project.meta.ai, modelId: "vorion" } } };
      useProjectStore.setState({ ...initialProjectStoreState, project: withModel });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce({ ...EMPTY_SETTINGS, defaultModelId: "openai/gpt-4o" });

      renderSettingsScreen();
      await screen.findByRole("checkbox", { name: "Enable AI for the open project" });

      await user.click(screen.getByRole("checkbox", { name: "Enable AI for the open project" }));

      expect(useProjectStore.getState().project?.meta.ai.modelId).toBe("vorion");
    });
  });

  describe("debug: redaction policy (J2/D-205)", () => {
    test("shows a message instead of the controls when no project is open", async () => {
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByText("Redaction (debug)")).toBeTruthy();
      expect(screen.queryByLabelText("Mode")).toBeNull();
    });

    test("defaults to off mode and an empty terms list for a fresh project", async () => {
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByText("Off")).toBeTruthy();
      expect(screen.getByLabelText("Terms to mask (one per line)")).toHaveProperty("value", "");
    });

    test("selecting customers mode persists it onto the project", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();
      await screen.findByLabelText("Mode");

      await user.click(screen.getByLabelText("Mode"));
      await user.click(await screen.findByRole("option", { name: "Mask customer names" }));

      expect(useProjectStore.getState().project?.meta.ai.redaction).toEqual({
        mode: "customers",
        terms: [],
        preserveNumbers: true,
      });
    });

    test("typing terms and blurring persists the parsed, trimmed list", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();
      const termsField = await screen.findByLabelText("Terms to mask (one per line)");

      await user.type(termsField, "Acme Corp{enter} Beta Inc {enter}{enter}");
      await user.tab();

      expect(useProjectStore.getState().project?.meta.ai.redaction.terms).toEqual(["Acme Corp", "Beta Inc"]);
    });

    test("shows the project's already-set mode and terms on load", async () => {
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      const withRedaction = {
        ...project,
        meta: {
          ...project.meta,
          ai: { ...project.meta.ai, redaction: { mode: "customers" as const, terms: ["Acme Corp"], preserveNumbers: true as const } },
        },
      };
      useProjectStore.setState({ ...initialProjectStoreState, project: withRedaction });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByText("Mask customer names")).toBeTruthy();
      expect(screen.getByLabelText("Terms to mask (one per line)")).toHaveProperty("value", "Acme Corp");
    });
  });

  describe("Project Info (Faz 11/L1, D-223/D-224) — permanent, not a debug section", () => {
    test("shows a message instead of the fields when no project is open", async () => {
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByText("Open a project to edit these fields.")).toBeTruthy();
      expect(screen.queryByLabelText("Priority")).toBeNull();
    });

    test("shows all three fields unset for a fresh project", async () => {
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByLabelText("Target Closure")).toHaveProperty("value", "");
      expect(screen.getAllByText("Not set")).toHaveLength(2); // priority + generalRag selects
    });

    test("choosing a priority persists it onto project.meta.priority", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();
      await screen.findByLabelText("Priority");

      await user.click(screen.getByLabelText("Priority"));
      await user.click(await screen.findByRole("option", { name: "High" }));

      expect(useProjectStore.getState().project?.meta.priority).toBe("high");
    });

    test("choosing a General RAG status persists it, leaving priority/targetClosureDate untouched", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      const withPriority = { ...project, meta: { ...project.meta, priority: "medium" } };
      useProjectStore.setState({ ...initialProjectStoreState, project: withPriority });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();
      await screen.findByLabelText("General RAG");

      await user.click(screen.getByLabelText("General RAG"));
      await user.click(await screen.findByRole("option", { name: "Amber" }));

      const updated = useProjectStore.getState().project;
      expect(updated?.meta.generalRag).toBe("amber");
      expect(updated?.meta.priority).toBe("medium");
    });

    test("typing a target closure date persists it onto project.meta.targetClosureDate", async () => {
      const user = userEvent.setup();
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      useProjectStore.setState({ ...initialProjectStoreState, project });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();
      const dateField = await screen.findByLabelText("Target Closure");

      await user.type(dateField, "2026-12-01");

      expect(useProjectStore.getState().project?.meta.targetClosureDate).toBe("2026-12-01");
    });

    test("shows the project's already-set values on load", async () => {
      const { project } = createNewProject({ title: "T", language: "en", appVersion: "0.1.0" });
      const withInfo = {
        ...project,
        meta: { ...project.meta, priority: "critical", targetClosureDate: "2026-12-01", generalRag: "red" as const },
      };
      useProjectStore.setState({ ...initialProjectStoreState, project: withInfo });
      mocked.getKeyStatus.mockResolvedValueOnce(null);
      mocked.getAiSettings.mockResolvedValueOnce(EMPTY_SETTINGS);

      renderSettingsScreen();

      expect(await screen.findByText("Critical")).toBeTruthy();
      expect(screen.getByText("Red")).toBeTruthy();
      expect(screen.getByLabelText("Target Closure")).toHaveProperty("value", "2026-12-01");
    });
  });
});
