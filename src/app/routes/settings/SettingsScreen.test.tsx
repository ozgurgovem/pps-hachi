import { afterEach, describe, expect, test, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import "../../../i18n";
import { SettingsScreen } from "./SettingsScreen";
import * as settingsIpc from "../../../ai/settingsIpc";

vi.mock("../../../ai/settingsIpc");

const mocked = vi.mocked(settingsIpc);

const EMPTY_SETTINGS: settingsIpc.AiSettings = {
  enabled: false,
  defaultModelId: null,
  fastModelId: null,
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
});
