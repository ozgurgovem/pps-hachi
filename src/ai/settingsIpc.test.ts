import { describe, expect, test, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import {
  getAiSettings,
  getCostSummary,
  getKeyStatus,
  listModels,
  removeApiKey,
  setAiSettings,
  setApiKey,
  testConnection,
} from "./settingsIpc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("settingsIpc", () => {
  test("setApiKey invokes ai_set_key with the key and returns the masked preview", async () => {
    mockInvoke.mockResolvedValueOnce("nk_live_…d41d");

    const masked = await setApiKey("nk_live_this_is_a_fake_test_only_key");

    expect(mockInvoke).toHaveBeenCalledWith("ai_set_key", { key: "nk_live_this_is_a_fake_test_only_key" });
    expect(masked).toBe("nk_live_…d41d");
  });

  test("getKeyStatus invokes ai_key_status with no arguments", async () => {
    mockInvoke.mockResolvedValueOnce(null);

    const status = await getKeyStatus();

    expect(mockInvoke).toHaveBeenCalledWith("ai_key_status");
    expect(status).toBeNull();
  });

  test("removeApiKey invokes ai_remove_key with no arguments", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await removeApiKey();

    expect(mockInvoke).toHaveBeenCalledWith("ai_remove_key");
  });

  test("testConnection invokes ai_test_connection with the model id", async () => {
    mockInvoke.mockResolvedValueOnce({ success: true, latencyMs: 420, error: null });

    const status = await testConnection("openai/gpt-4o");

    expect(mockInvoke).toHaveBeenCalledWith("ai_test_connection", { modelId: "openai/gpt-4o" });
    expect(status).toEqual({ success: true, latencyMs: 420, error: null });
  });

  test("listModels invokes ai_list_models with no arguments", async () => {
    const models = [{ id: "openai/gpt-4o", name: "GPT-4o", provider: "openai" }];
    mockInvoke.mockResolvedValueOnce(models);

    const result = await listModels();

    expect(mockInvoke).toHaveBeenCalledWith("ai_list_models");
    expect(result).toEqual(models);
  });

  test("getAiSettings invokes ai_get_settings with no arguments", async () => {
    const settings = { enabled: false, defaultModelId: null, fastModelId: null };
    mockInvoke.mockResolvedValueOnce(settings);

    const result = await getAiSettings();

    expect(mockInvoke).toHaveBeenCalledWith("ai_get_settings");
    expect(result).toEqual(settings);
  });

  test("setAiSettings invokes ai_set_settings with the settings object", async () => {
    mockInvoke.mockResolvedValueOnce(undefined);
    const settings = { enabled: true, defaultModelId: "openai/gpt-4o", fastModelId: null, spendCapUsd: 25 };

    await setAiSettings(settings);

    expect(mockInvoke).toHaveBeenCalledWith("ai_set_settings", { settings });
  });

  test("getCostSummary invokes ai_get_cost_summary with the project id", async () => {
    const summary = {
      project: { inputTokens: 100, outputTokens: 40, costUsd: 0.002, requestCount: 1 },
      currentMonth: { inputTokens: 500, outputTokens: 200, costUsd: 0.01, requestCount: 5 },
      spendCapUsd: 25,
      capExceeded: false,
    };
    mockInvoke.mockResolvedValueOnce(summary);

    const result = await getCostSummary("proj-1");

    expect(mockInvoke).toHaveBeenCalledWith("ai_get_cost_summary", { projectId: "proj-1" });
    expect(result).toEqual(summary);
  });
});
