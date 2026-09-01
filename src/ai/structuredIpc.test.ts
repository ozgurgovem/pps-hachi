import { describe, expect, test, vi } from "vitest";
import { invoke } from "@tauri-apps/api/core";
import type { ResolvedRedactionPolicy } from "./redaction";
import { completeStructured } from "./structuredIpc";

vi.mock("@tauri-apps/api/core", () => ({
  invoke: vi.fn(),
}));

const mockInvoke = vi.mocked(invoke);

const OFF: ResolvedRedactionPolicy = { mode: "off", terms: [], preserveNumbers: true };

describe("completeStructured", () => {
  test("invokes ai_complete_structured with prompt/schema/modelId/redaction", async () => {
    mockInvoke.mockResolvedValueOnce({ unit: "count", categories: [] });

    await completeStructured("draft a pareto payload", { type: "object" }, "vorion/gpt-4o", OFF);

    expect(mockInvoke).toHaveBeenCalledWith("ai_complete_structured", {
      prompt: "draft a pareto payload",
      schema: { type: "object" },
      modelId: "vorion/gpt-4o",
      redaction: OFF,
    });
  });

  test("forwards a customers-mode redaction policy unchanged", async () => {
    mockInvoke.mockResolvedValueOnce({});
    const redaction: ResolvedRedactionPolicy = { mode: "customers", terms: ["Acme Corp"], preserveNumbers: true };

    await completeStructured("p", {}, "vorion", redaction);

    expect(mockInvoke).toHaveBeenCalledWith("ai_complete_structured", {
      prompt: "p",
      schema: {},
      modelId: "vorion",
      redaction,
    });
  });

  test("resolves with whatever raw value the backend returns, unvalidated", async () => {
    const raw = { unrelated: "shape" };
    mockInvoke.mockResolvedValueOnce(raw);

    const result = await completeStructured("p", {}, "vorion", OFF);

    expect(result).toEqual(raw);
  });

  test("rejects when the backend rejects (e.g. the model's response wasn't valid JSON)", async () => {
    mockInvoke.mockRejectedValueOnce(new Error("not json at all"));

    await expect(completeStructured("p", {}, "vorion", OFF)).rejects.toThrow("not json at all");
  });
});
