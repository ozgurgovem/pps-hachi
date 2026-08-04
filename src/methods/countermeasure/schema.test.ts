import { describe, expect, it } from "vitest";
import { countermeasureMethod } from ".";
import { CountermeasurePayloadSchema } from "./schema";

describe("CountermeasurePayloadSchema", () => {
  it("accepts the empty payload the plugin creates, defaulting the status to proposed", () => {
    const empty = countermeasureMethod.createEmptyPayload();

    expect(CountermeasurePayloadSchema.safeParse(empty).success).toBe(true);
    expect(empty).toMatchObject({ status: "proposed" });
  });

  it("accepts a status this build does not know", () => {
    expect(
      CountermeasurePayloadSchema.safeParse({
        ...countermeasureMethod.createEmptyPayload(),
        status: "onHold",
      }).success,
    ).toBe(true);
  });

  /**
   * The granularity call: one countermeasure per entry, so its root-cause
   * links live on that entry. A payload holding a *list* would force the
   * links into a union that §1.2 S5's per-countermeasure rule cannot read.
   */
  it("describes one countermeasure, not a list of them", () => {
    const parsed = CountermeasurePayloadSchema.parse(countermeasureMethod.createEmptyPayload());

    expect("rows" in parsed).toBe(false);
    expect("description" in parsed).toBe(true);
  });

  it("carries no error-proofing level — that is 6c's separate selector method", () => {
    expect("errorProofingLevel" in countermeasureMethod.createEmptyPayload()).toBe(false);
  });
});

describe("countermeasureMethod", () => {
  it("declares a multi-valued rootCause role targeting Step 4", () => {
    expect(countermeasureMethod.referenceRoles).toEqual([
      {
        role: "rootCause",
        labelKey: "methods.countermeasure.references.rootCause.label",
        emptyKey: "methods.countermeasure.references.rootCause.empty",
        fromSteps: [4],
        multiple: true,
      },
    ]);
  });

  it("belongs to Step 5", () => {
    expect(countermeasureMethod.steps).toEqual([5]);
  });
});
