import { describe, expect, it } from "vitest";
import { implementationIssuesLogMethod } from ".";
import { ImplementationIssuesLogPayloadSchema } from "./schema";

describe("ImplementationIssuesLogPayloadSchema", () => {
  it("accepts a payload with several logged issues", () => {
    expect(
      ImplementationIssuesLogPayloadSchema.safeParse({
        rows: [{ id: "1", date: "2026-08-10", issue: "Fixture misaligned", impact: "3 h downtime", resolution: "Realigned", status: "resolved" }],
      }).success,
    ).toBe(true);
  });

  it("accepts the empty payload the plugin creates", () => {
    expect(ImplementationIssuesLogPayloadSchema.safeParse(implementationIssuesLogMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("belongs to Step 6", () => {
    expect(implementationIssuesLogMethod.steps).toEqual([6]);
  });
});
