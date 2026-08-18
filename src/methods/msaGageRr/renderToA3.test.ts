import { describe, expect, it } from "vitest";
import { renderMsaGageRrToA3 } from "./renderToA3";
import type { MsaGageRrPayload } from "./schema";

function emptyPayload(): MsaGageRrPayload {
  return { method: "", evaluator: "", date: "", percentGrr: "", verdict: "inconclusive", note: "" };
}

describe("renderMsaGageRrToA3", () => {
  it("renders the verdict, non-blank fields and note after the bold title", () => {
    const payload: MsaGageRrPayload = {
      method: "Gage R&R",
      evaluator: "Ayşe Yılmaz",
      date: "",
      percentGrr: "8.2",
      verdict: "trustworthy",
      note: "Within range",
    };
    const content = renderMsaGageRrToA3(payload, { id: "e1", title: "Torque gauge check" });

    expect(content.lines).toEqual([
      { text: "Torque gauge check", bold: true },
      { text: "Verdict: Trustworthy" },
      { text: "Method: Gage R&R" },
      { text: "Evaluator: Ayşe Yılmaz" },
      { text: "% GRR: 8.2" },
      { text: "Note: Within range" },
    ]);
  });

  it("renders only the title and verdict when every other field is blank", () => {
    const content = renderMsaGageRrToA3(emptyPayload(), { id: "e1", title: "Torque gauge check" });
    expect(content.lines).toEqual([
      { text: "Torque gauge check", bold: true },
      { text: "Verdict: Inconclusive" },
    ]);
  });

  /** D-188/P-26: `entry.language` picks the verdict prefix, field labels and note label. */
  it("uses Turkish text when the entry's language is tr", () => {
    const payload: MsaGageRrPayload = {
      method: "Gage R&R",
      evaluator: "",
      date: "",
      percentGrr: "",
      verdict: "trustworthy",
      note: "",
    };
    const content = renderMsaGageRrToA3(payload, { id: "e1", title: "Torque gauge check", language: "tr" });

    expect(content.lines).toEqual([
      { text: "Torque gauge check", bold: true },
      { text: "Sonuç: Güvenilir" },
      { text: "Yöntem: Gage R&R" },
    ]);
  });
});
