import { describe, expect, it } from "vitest";
import { pfmeaLinkageMethod } from ".";
import { PfmeaLinkagePayloadSchema } from "./schema";

describe("PfmeaLinkagePayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(PfmeaLinkagePayloadSchema.safeParse(pfmeaLinkageMethod.createEmptyPayload()).success).toBe(true);
  });

  it("keeps O/D ratings as recorded strings (D-120) — nothing here recomputes an RPN", () => {
    const parsed = PfmeaLinkagePayloadSchema.parse({
      ...pfmeaLinkageMethod.createEmptyPayload(),
      severity: "8",
      occurrence: "4",
      detection: "6",
    });

    expect(parsed.severity).toBe("8");
    expect("rpn" in parsed).toBe(false);
  });
});

describe("pfmeaLinkageMethod", () => {
  /**
   * The scope call this method exists to record: SPEC.md §1.3 describes it
   * with the word "reference", but a PFMEA is an external controlled document
   * (§4.2's `meta.linkedRecords[]`), not an entry — so D-116's entry-to-entry
   * mechanism does not apply, and this counts as one of Step 4's five *plain*
   * methods in D-114's slice arithmetic.
   */
  it("declares no reference roles — a PFMEA is an external document, not an entry", () => {
    expect(pfmeaLinkageMethod.referenceRoles).toBeUndefined();
  });

  it("belongs to Step 4", () => {
    expect(pfmeaLinkageMethod.steps).toEqual([4]);
  });
});
