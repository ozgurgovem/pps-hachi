import { describe, expect, it } from "vitest";
import { actionItemMethod } from ".";
import { ActionItemPayloadSchema } from "./schema";

describe("ActionItemPayloadSchema", () => {
  it("accepts the empty payload the plugin creates", () => {
    expect(ActionItemPayloadSchema.safeParse(actionItemMethod.createEmptyPayload()).success).toBe(true);
  });

  it("keeps status % a string (D-120) — nothing sums or plots it in 6b", () => {
    const parsed = ActionItemPayloadSchema.parse({
      ...actionItemMethod.createEmptyPayload(),
      percentComplete: "60",
    });

    expect(parsed.percentComplete).toBe("60");
  });

  /** The Gantt is deferred, but its inputs are recorded so it needs no migration later. */
  it("records both dates the deferred Gantt would need", () => {
    const empty = actionItemMethod.createEmptyPayload();

    expect("startDate" in empty).toBe(true);
    expect("dueDate" in empty).toBe(true);
  });
});

describe("actionItemMethod", () => {
  it("declares a single-valued countermeasure role targeting Step 5", () => {
    expect(actionItemMethod.referenceRoles).toEqual([
      {
        role: "countermeasure",
        labelKey: "methods.actionItem.references.countermeasure.label",
        emptyKey: "methods.actionItem.references.countermeasure.empty",
        fromSteps: [5],
        multiple: false,
      },
    ]);
  });

  it("belongs to Step 6", () => {
    expect(actionItemMethod.steps).toEqual([6]);
  });
});
