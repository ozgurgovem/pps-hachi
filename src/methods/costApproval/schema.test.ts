import { describe, expect, it } from "vitest";
import { costApprovalMethod } from ".";
import { CostApprovalPayloadSchema } from "./schema";

describe("CostApprovalPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(CostApprovalPayloadSchema.safeParse(costApprovalMethod.createEmptyPayload()).success).toBe(true);
  });

  it("defaults approvalStatus to the first option (pending)", () => {
    expect((costApprovalMethod.createEmptyPayload() as { approvalStatus: string }).approvalStatus).toBe("pending");
  });

  it("belongs to Step 5", () => {
    expect(costApprovalMethod.steps).toEqual([5]);
  });
});
