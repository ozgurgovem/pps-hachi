import { describe, expect, it } from "vitest";
import type { A3EntrySummary } from "../../a3/methodContract";
import { actionItemMethod } from ".";
import { renderActionItemToA3 } from "./renderToA3";
import type { ActionItemPayload } from "./schema";

const ENTRY: A3EntrySummary = { id: "e1", title: "Fit sensor" };
const EMPTY = actionItemMethod.createEmptyPayload() as ActionItemPayload;

describe("renderActionItemToA3", () => {
  it("exports action, owner, dates and status in declared order", () => {
    const payload: ActionItemPayload = {
      ...EMPTY,
      action: "Install presence sensor",
      owner: "M. Yıldız",
      startDate: "2026-08-10",
      dueDate: "2026-08-24",
      percentComplete: "60",
    };

    expect(renderActionItemToA3(payload, ENTRY).lines).toEqual([
      { text: "Fit sensor", bold: true },
      { text: "Action: Install presence sensor" },
      { text: "Owner: M. Yıldız" },
      { text: "Start: 2026-08-10" },
      { text: "Due: 2026-08-24" },
      { text: "Status %: 60" },
    ]);
  });

  it("renders only the title for an untouched action", () => {
    expect(renderActionItemToA3(EMPTY, ENTRY).lines).toHaveLength(1);
  });
});
