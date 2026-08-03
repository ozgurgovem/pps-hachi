import { describe, expect, it } from "vitest";
import { ProcessFlowSipocPayloadSchema } from "./schema";

describe("ProcessFlowSipocPayloadSchema", () => {
  it("accepts a payload with several process step rows", () => {
    const result = ProcessFlowSipocPayloadSchema.safeParse({
      rows: [
        {
          id: "1",
          step: "Weld",
          supplier: "Press shop",
          input: "Stamped panel",
          process: "Robotic weld",
          output: "Welded assembly",
          customer: "Paint shop",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an empty row list — no process steps recorded yet", () => {
    const result = ProcessFlowSipocPayloadSchema.safeParse({ rows: [] });
    expect(result.success).toBe(true);
  });

  it("rejects a row missing a field entirely", () => {
    const result = ProcessFlowSipocPayloadSchema.safeParse({ rows: [{ id: "1", step: "Weld" }] });
    expect(result.success).toBe(false);
  });
});
