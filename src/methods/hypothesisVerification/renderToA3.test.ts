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
            confidencePercent: "",
            residualUncertainty: "",
            customerRelevance: "",
          },
          {
            id: "r2",
            candidateCause: "Operator error",
            verificationMethod: "Observed 2 shifts",
            evidence: "Procedure followed",
            verdict: "rejected",
            confidencePercent: "",
            residualUncertainty: "",
            customerRelevance: "",
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
      {
        rows: [
          {
            id: "r1",
            candidateCause: "x",
            verificationMethod: "",
            evidence: "",
            verdict: "deferred",
            confidencePercent: "",
            residualUncertainty: "",
            customerRelevance: "",
          },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({ text: "[deferred] x" });
  });

  it("drops a row with nothing recorded on it", () => {
    const lines = renderHypothesisVerificationToA3(
      {
        rows: [
          {
            id: "r1",
            candidateCause: "  ",
            verificationMethod: "",
            evidence: "",
            verdict: "confirmed",
            confidencePercent: "",
            residualUncertainty: "",
            customerRelevance: "",
          },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines).toHaveLength(1);
  });

  /** B1's §13.4 candidate 5: three metric fields, labeled so they read distinctly from the unlabeled narrative triad. */
  it("appends confidence/residual-uncertainty/customer-relevance as a labeled segment", () => {
    const lines = renderHypothesisVerificationToA3(
      {
        rows: [
          {
            id: "r1",
            candidateCause: "Die wear",
            verificationMethod: "Measured 20 parts",
            evidence: "0.08 mm over tolerance",
            verdict: "confirmed",
            confidencePercent: "90%",
            residualUncertainty: "Low",
            customerRelevance: "High",
          },
        ],
      },
      ENTRY,
    ).lines;

    expect(lines[1]).toEqual({
      text:
        "[CONFIRMED] Die wear · Measured 20 parts · 0.08 mm over tolerance — " +
        "Confidence: 90% · Residual uncertainty: Low · Customer relevance: High",
      bold: true,
    });
  });

  /**
   * A `.ppsx` saved before these three fields existed has rows genuinely
   * missing the keys at runtime (`Entry.payload` is never Zod-validated on
   * load, D-52) — `renderToA3` must not throw on `undefined.trim()`.
   */
  it("tolerates a legacy row missing the three new fields", () => {
    const legacyRow = {
      id: "r1",
      candidateCause: "Die wear",
      verificationMethod: "",
      evidence: "",
      verdict: "confirmed",
    } as unknown as {
      id: string;
      candidateCause: string;
      verificationMethod: string;
      evidence: string;
      verdict: string;
      confidencePercent: string;
      residualUncertainty: string;
      customerRelevance: string;
    };

    expect(() => renderHypothesisVerificationToA3({ rows: [legacyRow] }, ENTRY)).not.toThrow();
    const lines = renderHypothesisVerificationToA3({ rows: [legacyRow] }, ENTRY).lines;
    expect(lines[1]).toEqual({ text: "[CONFIRMED] Die wear", bold: true });
  });
});
