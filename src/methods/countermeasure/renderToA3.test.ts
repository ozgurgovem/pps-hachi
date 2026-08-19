import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { countermeasureMethod } from ".";
import { renderCountermeasureToA3 } from "./renderToA3";
import type { CountermeasurePayload } from "./schema";

const ENTRY: A3EntrySummary = { id: "e1", title: "Poka-yoke at OP30" };
const EMPTY = countermeasureMethod.createEmptyPayload() as CountermeasurePayload;

describe("renderCountermeasureToA3", () => {
  it("exports the populated fields with a human-readable status", () => {
    const payload: CountermeasurePayload = {
      ...EMPTY,
      description: "Fit a presence sensor on the fixture",
      owner: "M. Yıldız",
      status: "approved",
    };

    expect(renderCountermeasureToA3(payload, ENTRY).lines).toEqual([
      { text: "■ Poka-yoke at OP30", bold: true, tone: "positive" },
      { text: "Countermeasure: Fit a presence sensor on the fixture" },
      { text: "Owner: M. Yıldız" },
      { text: "Status: Approved" },
      { text: "Priority decision: Pending" },
    ]);
  });

  it("passes an unrecognized status through rather than blanking it", () => {
    const lines = renderCountermeasureToA3({ ...EMPTY, status: "onHold" }, ENTRY).lines;

    expect(lines).toContainEqual({ text: "Status: onHold" });
  });

  it("omits the status line when it was cleared", () => {
    const lines = renderCountermeasureToA3({ ...EMPTY, status: "", priorityDecision: "" }, ENTRY).lines;

    expect(lines).toHaveLength(1);
  });

  /** P-37: D-41's shape-coded status marker — shape carries meaning, tone reinforces it. */
  it.each([
    ["approved", "■", "positive"],
    ["proposed", "●", "caution"],
    ["rejected", "▲", "negative"],
  ] as const)("marks status %s with glyph %s and tone %s on the title line", (status, glyph, tone) => {
    const lines = renderCountermeasureToA3({ ...EMPTY, status }, ENTRY).lines;

    expect(lines[0]).toEqual({ text: `${glyph} Poka-yoke at OP30`, bold: true, tone });
  });

  it("leaves the title line unmarked for an unrecognized status", () => {
    const lines = renderCountermeasureToA3({ ...EMPTY, status: "onHold" }, ENTRY).lines;

    expect(lines[0]).toEqual({ text: "Poka-yoke at OP30", bold: true });
  });

  /** D-188/P-26: `entry.language` picks both the field labels and the status export label. */
  it("uses Turkish field labels and status text when the entry's language is tr", () => {
    const trEntry: A3EntrySummary = { ...ENTRY, language: "tr" };
    const payload: CountermeasurePayload = { ...EMPTY, description: "OP30'a sensör takıldı", status: "approved" };

    expect(renderCountermeasureToA3(payload, trEntry).lines).toEqual([
      { text: "■ Poka-yoke at OP30", bold: true, tone: "positive" },
      { text: "Karşı önlem: OP30'a sensör takıldı" },
      { text: "Durum: Onaylandı" },
      { text: "Öncelik kararı: Beklemede" },
    ]);
  });
});

describe("renderCountermeasureToA3 — priority score (Barış's Uygulama Planı table, 2026-08-18)", () => {
  it("shows the computed priority score, marked with the decision's own glyph — not the title's", () => {
    const payload: CountermeasurePayload = {
      ...EMPTY,
      status: "", // isolates the assertion below: no status glyph competing for the title line
      impactScore: "5",
      costScore: "4",
      durationScore: "4",
      priorityDecision: "pursue",
    };

    const lines = renderCountermeasureToA3(payload, ENTRY).lines;

    expect(lines).toContainEqual({ text: "■ Priority score: 80", tone: "positive" });
    // The title keeps `status`'s own glyph (or none) — the two decisions never fight over one line.
    expect(lines[0]).toEqual({ text: "Poka-yoke at OP30", bold: true });
  });

  it("marks a high-impact-but-impractical countermeasure's score line negative when abandoned", () => {
    const payload: CountermeasurePayload = {
      ...EMPTY,
      impactScore: "5",
      costScore: "1",
      durationScore: "1",
      priorityDecision: "abandon",
    };

    const lines = renderCountermeasureToA3(payload, ENTRY).lines;

    expect(lines).toContainEqual({ text: "▲ Priority score: 5", tone: "negative" });
  });

  it("shows no priority score line when any of the three scores is blank", () => {
    const lines = renderCountermeasureToA3({ ...EMPTY, impactScore: "5", costScore: "4" }, ENTRY).lines;

    expect(lines.some((line) => line.text.includes("Priority score"))).toBe(false);
  });

  it("does not crash on an entry persisted before these fields existed (D-52: payload is never Zod-validated on load)", () => {
    const legacyPayload = {
      description: "Old countermeasure",
      expectedEffect: "",
      owner: "",
      targetDate: "",
      status: "approved",
    } as unknown as CountermeasurePayload;

    const lines = renderCountermeasureToA3(legacyPayload, ENTRY).lines;

    expect(lines.some((line) => line.text.includes("Priority score"))).toBe(false);
    expect(lines.some((line) => line.text.includes("Priority decision"))).toBe(false);
  });
});
