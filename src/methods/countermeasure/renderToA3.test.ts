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
    ]);
  });

  it("passes an unrecognized status through rather than blanking it", () => {
    const lines = renderCountermeasureToA3({ ...EMPTY, status: "onHold" }, ENTRY).lines;

    expect(lines).toContainEqual({ text: "Status: onHold" });
  });

  it("omits the status line when it was cleared", () => {
    const lines = renderCountermeasureToA3({ ...EMPTY, status: "" }, ENTRY).lines;

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
});
