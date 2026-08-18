import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { pfmeaLinkageMethod } from ".";
import { renderPfmeaLinkageToA3 } from "./renderToA3";
import type { PfmeaLinkagePayload } from "./schema";

const ENTRY: A3EntrySummary = { id: "e1", title: "PFMEA line 40" };
const EMPTY = pfmeaLinkageMethod.createEmptyPayload() as PfmeaLinkagePayload;

describe("renderPfmeaLinkageToA3", () => {
  it("exports the identity and ratings in declared order, skipping blanks", () => {
    const payload: PfmeaLinkagePayload = {
      ...EMPTY,
      documentNo: "PF-2210",
      revision: "C",
      failureMode: "Short shot",
      severity: "8",
      detection: "6",
    };

    expect(renderPfmeaLinkageToA3(payload, ENTRY).lines).toEqual([
      { text: "PFMEA line 40", bold: true },
      { text: "PFMEA no: PF-2210" },
      { text: "Rev: C" },
      { text: "Failure mode: Short shot" },
      { text: "S: 8" },
      { text: "D: 6" },
    ]);
  });

  it("renders only the title for an untouched linkage", () => {
    expect(renderPfmeaLinkageToA3(EMPTY, ENTRY).lines).toHaveLength(1);
  });

  /** D-188/P-26: `entry.language` picks the export label variant. */
  it("uses Turkish field labels when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const payload: PfmeaLinkagePayload = { ...EMPTY, documentNo: "PF-2210", failureMode: "Kısa dolum" };

    expect(renderPfmeaLinkageToA3(payload, trEntry).lines).toEqual([
      { text: "PFMEA line 40", bold: true },
      { text: "PFMEA no: PF-2210" },
      { text: "Hata türü: Kısa dolum" },
    ]);
  });
});
