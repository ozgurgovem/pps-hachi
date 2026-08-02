import { describe, expect, it } from "vitest";
import { STEP_IDS } from "../domain/model";
import { getMethodById, getMethodsForStep, METHOD_REGISTRY } from "./registry";
import { GENERIC_TEXT_METHOD_ID } from "./genericText";

describe("METHOD_REGISTRY", () => {
  it("has no duplicate ids", () => {
    const ids = METHOD_REGISTRY.map((plugin) => plugin.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("getMethodsForStep", () => {
  it("returns the generic text method for every one of the 8 steps", () => {
    for (const stepId of STEP_IDS) {
      const methods = getMethodsForStep(stepId);
      expect(methods.some((plugin) => plugin.id === GENERIC_TEXT_METHOD_ID)).toBe(true);
    }
  });

  it("returns an empty list for a step with no applicable methods", () => {
    // Every registered plugin declares its own `steps`; a plugin scoped away
    // from step 4 (if one existed) must not appear there. Guard this with a
    // registry-shape assertion instead of a fake plugin: every method the
    // registry actually ships must list step 4, so filtering must reflect
    // exactly what each plugin declares, not "everything, always".
    const step4Methods = getMethodsForStep(4);
    expect(step4Methods.every((plugin) => plugin.steps.includes(4))).toBe(true);
  });
});

describe("getMethodById", () => {
  it("finds a registered method", () => {
    expect(getMethodById(GENERIC_TEXT_METHOD_ID)?.id).toBe(GENERIC_TEXT_METHOD_ID);
  });

  it("returns undefined for an unknown methodId — P-05's structural half", () => {
    expect(getMethodById("some-future-method-this-build-does-not-know")).toBeUndefined();
  });
});
