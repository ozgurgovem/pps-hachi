import { describe, expect, test, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import { completeStructured } from "./structuredIpc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

describe("completeStructured", () => {
  test("invokes ai_complete_structured with prompt/schema/modelId", async () => {
    mockInvoke.mockResolvedValueOnce({ unit: "count", categories: [] });

    await completeStructured("draft a pareto payload", { type: "object" }, "vorion/gpt-4o");

    expect(mockInvoke).toHaveBeenCalledWith("ai_complete_structured", {
      prompt: "draft a pareto payload",
      schema: { type: "object" },
      modelId: "vorion/gpt-4o",
    });
  });

  test("resolves with whatever raw value the backend returns, unvalidated", async () => {
    const raw = { unrelated: "shape" };
    mockInvoke.mockResolvedValueOnce(raw);

    const result = await completeStructured("p", {}, "vorion");

    expect(result).toEqual(raw);
  });

  test("rejects when the backend rejects (e.g. the model's response wasn't valid JSON)", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("not json at all"));

    await expect(completeStructured("p", {}, "vorion")).rejects.toThrow("not json at all");
  });
});
