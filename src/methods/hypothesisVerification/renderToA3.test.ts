import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { renderHypothesisVerificationToA3 } from "./renderToA3";

const ENTRY: A3EntrySummary = { id: "e1", title: "Hypothesis table" };

describe("renderHypothesisVerificationToA3", () => {
  it("leads each row with its verdict and bolds a confirmed cause", () => {
    const lines = renderHypothesisVerificationToA3(
      {
        rows: [
          {
            id: "r1",
            candidateCause: "Die wear",
            verificationMethod: "Measured 20 parts",
            evidence: "0.08 mm over tolerance",
            verdict: "confirmed",
          },
          {
            id: "r2",
            candidateCause: "Operator error",
            verificationMethod: "Observed 2 shifts",
            evidence: "Procedure followed",
            verdict: "rejected",
          },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({
      text: "[CONFIRMED] Die wear · Measured 20 parts · 0.08 mm over tolerance",
      bold: true,
    });
    expect(lines[2]).toEqual({ text: "[rejected] Operator error · Observed 2 shifts · Procedure followed" });
  });

  it("passes an unrecognized verdict through rather than dropping the row", () => {
    const lines = renderHypothesisVerificationToA3(
      { rows: [{ id: "r1", candidateCause: "x", verificationMethod: "", evidence: "", verdict: "deferred" }] },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({ text: "[deferred] x" });
  });

  it("drops a row with nothing recorded on it", () => {
    const lines = renderHypothesisVerificationToA3(
      { rows: [{ id: "r1", candidateCause: "  ", verificationMethod: "", evidence: "", verdict: "confirmed" }] },
      ENTRY,
    ).lines;

    expect(lines).toHaveLength(1);
  });
});
