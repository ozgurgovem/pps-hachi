import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { icaPcaTransitionMethod } from ".";
import { renderIcaPcaTransitionToA3 } from "./renderToA3";
import type { IcaPcaTransitionPayload } from "./schema";

const ENTRY: A3EntrySummary = { id: "e1", title: "Retire 100% sort" };
const EMPTY = icaPcaTransitionMethod.createEmptyPayload() as IcaPcaTransitionPayload;

describe("renderIcaPcaTransitionToA3", () => {
  it("exports the exit criteria, dates and a human-readable status", () => {
    const payload: IcaPcaTransitionPayload = {
      ...EMPTY,
      exitCriteria: "3 consecutive clean shifts after the sensor is fitted",
      plannedRemovalDate: "2026-09-01",
      status: "pcaInPlace",
    };

    expect(renderIcaPcaTransitionToA3(payload, ENTRY).lines).toEqual([
      { text: "Retire 100% sort", bold: true },
      { text: "Exit criteria: 3 consecutive clean shifts after the sensor is fitted" },
      { text: "Planned removal: 2026-09-01" },
      { text: "Status: PCA in place" },
    ]);
  });

  it("passes an unrecognized status through", () => {
    const lines = renderIcaPcaTransitionToA3({ ...EMPTY, status: "escalated" }, ENTRY).lines;

    expect(lines).toContainEqual({ text: "Status: escalated" });
  });
});
