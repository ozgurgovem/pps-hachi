import { describe, expect, it } from "vitest";
import { statisticalConfirmationMethod } from ".";
import { StatisticalConfirmationPayloadSchema } from "./schema";

describe("StatisticalConfirmationPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(StatisticalConfirmationPayloadSchema.safeParse(statisticalConfirmationMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("belongs to Step 7", () => {
    expect(statisticalConfirmationMethod.steps).toEqual([7]);
  });
});
