import { describe, expect, it } from "vitest";
import { documentUpdatesTrackerMethod } from ".";
import { DocumentUpdatesTrackerPayloadSchema } from "./schema";

describe("DocumentUpdatesTrackerPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(DocumentUpdatesTrackerPayloadSchema.safeParse(documentUpdatesTrackerMethod.createEmptyPayload()).success).toBe(
      true,
    );
  });

  it("belongs to Step 8", () => {
    expect(documentUpdatesTrackerMethod.steps).toEqual([8]);
  });

  it("accepts a payload with every document type populated", () => {
    const row = {
      updateRequired: "yes",
      docId: "PFMEA-004",
      revision: "Rev00 → Rev01",
      owner: "Quality Eng.",
      dueDate: "2026-09-01",
      status: "inProgress",
      approval: "underReview",
      evidence: "PFMEA-004-rev01.pdf",
      customerSubmission: "no",
    };
    const result = DocumentUpdatesTrackerPayloadSchema.safeParse({
      pfmea: row,
      controlPlan: row,
      workInstruction: row,
      inspectionStandard: row,
      trainingCompetence: row,
      layeredProcessAudit: row,
      apqpPpapRecord: row,
    });
    expect(result.success).toBe(true);
  });

  it("rejects a payload missing a document type entirely", () => {
    const result = DocumentUpdatesTrackerPayloadSchema.safeParse({
      pfmea: {
        updateRequired: "",
        docId: "",
        revision: "",
        owner: "",
        dueDate: "",
        status: "",
        approval: "",
        evidence: "",
        customerSubmission: "",
      },
    });
    expect(result.success).toBe(false);
  });
});
