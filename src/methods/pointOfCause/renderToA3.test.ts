import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { pointOfCauseMethod } from ".";
import { renderPointOfCauseToA3 } from "./renderToA3";
import type { PointOfCausePayload } from "./schema";

const ENTRY: A3EntrySummary = { id: "e1", title: "POC — OP30 gate" };
const EMPTY = pointOfCauseMethod.createEmptyPayload() as PointOfCausePayload;

describe("renderPointOfCauseToA3", () => {
  it("leads with the entry title in bold", () => {
    expect(renderPointOfCauseToA3(EMPTY, ENTRY).lines[0]).toEqual({ text: "POC — OP30 gate", bold: true });
  });

  it("emits one labelled line per populated field, in declared order", () => {
    const payload: PointOfCausePayload = {
      ...EMPTY,
      processStep: "OP30",
      location: "Cavity 4",
      evidence: "12 of 14 rejects came off cavity 4",
    };

    expect(renderPointOfCauseToA3(payload, ENTRY).lines.slice(1)).toEqual([
      { text: "Process step: OP30" },
      { text: "Location: Cavity 4" },
      { text: "Evidence: 12 of 14 rejects came off cavity 4" },
    ]);
  });

  it("renders nothing but the title for an untouched nomination", () => {
    expect(renderPointOfCauseToA3(EMPTY, ENTRY).lines).toHaveLength(1);
  });
});
