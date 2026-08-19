import { describe, expect, it } from "vitest";
import { resultVerdictMethod } from ".";
import { ResultVerdictPayloadSchema } from "./schema";

describe("ResultVerdictPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(ResultVerdictPayloadSchema.safeParse(resultVerdictMethod.createEmptyPayload()).success).toBe(true);
  });

  it("defaults verdict to the first option (pending)", () => {
    expect((resultVerdictMethod.createEmptyPayload() as { verdict: string }).verdict).toBe("pending");
  });

  it("belongs to Step 7", () => {
    expect(resultVerdictMethod.steps).toEqual([7]);
  });
});
