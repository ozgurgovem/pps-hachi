import { describe, expect, it } from "vitest";
import { kpiStripMethod } from ".";
import { KpiStripPayloadSchema } from "./schema";

describe("KpiStripPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(KpiStripPayloadSchema.safeParse(kpiStripMethod.createEmptyPayload()).success).toBe(true);
  });

  it("accepts a fully-filled item, including the optional sustain/result fields (P-36)", () => {
    const result = KpiStripPayloadSchema.safeParse({
      items: [
        {
          id: "i1",
          label: "Çapak Fire Oranı",
          unit: "%",
          baseline: 4.2,
          target: 1.0,
          actual: 2.1,
          sustain: 1.2,
          result: 1.0,
          status: "inProgress",
        },
      ],
    });
    expect(result.success).toBe(true);
  });

  it("accepts an item that omits sustain/result — the sustainment phase hasn't happened yet", () => {
    const result = KpiStripPayloadSchema.safeParse({
      items: [{ id: "i1", label: "Fire Oranı", unit: "%", baseline: 4.2, target: 1.0, actual: 2.1, status: "behind" }],
    });
    expect(result.success).toBe(true);
  });

  it("rejects an item with an unrecognized status", () => {
    const result = KpiStripPayloadSchema.safeParse({
      items: [{ id: "i1", label: "Fire Oranı", unit: "%", baseline: 4.2, target: 1.0, actual: 2.1, status: "done" }],
    });
    expect(result.success).toBe(false);
  });

  it("rejects an item with a non-numeric baseline", () => {
    const result = KpiStripPayloadSchema.safeParse({
      items: [{ id: "i1", label: "Fire Oranı", unit: "%", baseline: "4.2", target: 1.0, actual: 2.1, status: "onTarget" }],
    });
    expect(result.success).toBe(false);
  });

  it("belongs to Step 7", () => {
    expect(kpiStripMethod.steps).toEqual([7]);
  });
});
