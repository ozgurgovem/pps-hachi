import { describe, expect, it } from "vitest";
import { errorProofingHierarchyMethod } from ".";
import { ErrorProofingHierarchyPayloadSchema } from "./schema";

describe("ErrorProofingHierarchyPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(
      ErrorProofingHierarchyPayloadSchema.safeParse(errorProofingHierarchyMethod.createEmptyPayload()).success,
    ).toBe(true);
  });

  it("rejects a level outside the six documented ones", () => {
    expect(ErrorProofingHierarchyPayloadSchema.safeParse({ level: "guess", note: "" }).success).toBe(false);
  });
});
