import { describe, expect, it } from "vitest";
import { icaPcaTransitionMethod } from ".";
import { IcaPcaTransitionPayloadSchema } from "./schema";

describe("IcaPcaTransitionPayloadSchema", () => {
  it("accepts the empty payload the plugin creates, defaulting to ICA active", () => {
    const empty = icaPcaTransitionMethod.createEmptyPayload();

    expect(IcaPcaTransitionPayloadSchema.safeParse(empty).success).toBe(true);
    expect(empty).toMatchObject({ status: "icaActive" });
  });

  it("keeps the two linked entries out of the payload — they are references (D-116)", () => {
    const empty = icaPcaTransitionMethod.createEmptyPayload();

    expect("icaEntryId" in empty).toBe(false);
    expect("pcaEntryId" in empty).toBe(false);
  });
});

describe("icaPcaTransitionMethod", () => {
  /**
   * The only method holding two roles, and the one that exercises D-116's
   * loose `role` string: `containment` is a fourth constant beyond §4.2's
   * three, added with no schema change and no migration.
   */
  it("declares both a containment and a countermeasure role, each single-valued", () => {
    expect(icaPcaTransitionMethod.referenceRoles).toEqual([
      {
        role: "containment",
        labelKey: "methods.icaPcaTransition.references.containment.label",
        emptyKey: "methods.icaPcaTransition.references.containment.empty",
        fromSteps: [1],
        multiple: false,
      },
      {
        role: "countermeasure",
        labelKey: "methods.icaPcaTransition.references.countermeasure.label",
        emptyKey: "methods.icaPcaTransition.references.countermeasure.empty",
        fromSteps: [5],
        multiple: false,
      },
    ]);
  });

  it("targets the containment action in Step 1, where the ICA method lives", () => {
    expect(icaPcaTransitionMethod.referenceRoles?.[0]?.fromSteps).toEqual([1]);
  });

  it("belongs to Step 6", () => {
    expect(icaPcaTransitionMethod.steps).toEqual([6]);
  });
});
