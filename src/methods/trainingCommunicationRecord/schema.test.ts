import { describe, expect, it } from "vitest";
import { trainingCommunicationRecordMethod } from ".";
import { TrainingCommunicationRecordPayloadSchema } from "./schema";

describe("TrainingCommunicationRecordPayloadSchema", () => {
  it("accepts a payload with several recorded events", () => {
    expect(
      TrainingCommunicationRecordPayloadSchema.safeParse({
        rows: [{ id: "1", date: "2026-08-10", audience: "Line 3 operators", method: "Toolbox talk", acknowledgedBy: "12 signed" }],
      }).success,
    ).toBe(true);
  });

  it("accepts the empty payload the plugin creates", () => {
    expect(
      TrainingCommunicationRecordPayloadSchema.safeParse(trainingCommunicationRecordMethod.createEmptyPayload()).success,
    ).toBe(true);
  });

  it("belongs to Step 6", () => {
    expect(trainingCommunicationRecordMethod.steps).toEqual([6]);
  });
});
