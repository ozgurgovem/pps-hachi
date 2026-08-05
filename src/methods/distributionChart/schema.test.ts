import { describe, expect, it } from "vitest";
import { distributionChartMethod } from ".";
import { DistributionChartPayloadSchema } from "./schema";

describe("DistributionChartPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(DistributionChartPayloadSchema.safeParse(distributionChartMethod.createEmptyPayload()).success).toBe(true);
  });

  it("accepts a histogram payload with string-typed sample values (D-120)", () => {
    const parsed = DistributionChartPayloadSchema.parse({
      chartType: "histogram",
      unit: "mm",
      binCount: "",
      samples: [{ id: "s1", value: "12.4" }],
      points: [],
    });
    expect(parsed.samples[0]?.value).toBe("12.4");
  });

  it("accepts a scatter payload with x/y pairs", () => {
    const parsed = DistributionChartPayloadSchema.parse({
      chartType: "scatter",
      unit: "",
      binCount: "",
      samples: [],
      points: [{ id: "p1", x: "1", y: "2" }],
    });
    expect(parsed.points[0]).toEqual({ id: "p1", x: "1", y: "2" });
  });

  it("rejects an unknown chartType", () => {
    expect(
      DistributionChartPayloadSchema.safeParse({
        chartType: "pie",
        unit: "",
        binCount: "",
        samples: [],
        points: [],
      }).success,
    ).toBe(false);
  });

  it("rejects a numeric sample value — the schema stays string-typed so a half-typed value round-trips", () => {
    expect(
      DistributionChartPayloadSchema.safeParse({
        chartType: "histogram",
        unit: "",
        binCount: "",
        samples: [{ id: "s1", value: 12.4 }],
        points: [],
      }).success,
    ).toBe(false);
  });
});
