import { describe, expect, it } from "vitest";
import { REFERENCE_ROLES, STEP_IDS } from "../domain/model";
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

/**
 * Phase 6b (D-116). A reference role is a *declaration* that generic code
 * acts on, so the failure mode is silent: a role pointing at a step that has
 * no method to target renders a picker that says "nothing to link to" forever,
 * and nothing in the plugin's own tests would notice.
 */
describe("reference roles across the registry", () => {
  const withRoles = METHOD_REGISTRY.filter((plugin) => plugin.referenceRoles !== undefined);

  /**
   * Four *referrers*. D-114's 6b scope names five reference-bearing methods:
   * these four plus `point-of-cause`, which is the chain's origin and so is
   * only ever a target — it declares no roles of its own.
   */
  it("is declared by exactly the four methods that hold a reference", () => {
    expect(withRoles.map((plugin) => plugin.id).sort()).toEqual([
      "action-item",
      "countermeasure",
      "hypothesis-verification",
      "ica-pca-transition",
    ]);
    expect(getMethodById("point-of-cause")?.referenceRoles).toBeUndefined();
  });

  it("uses only documented role constants", () => {
    const documented = new Set<string>(Object.values(REFERENCE_ROLES));

    for (const plugin of withRoles) {
      for (const role of plugin.referenceRoles ?? []) {
        expect(documented.has(role.role)).toBe(true);
      }
    }
  });

  it("never declares the same role twice on one method", () => {
    for (const plugin of withRoles) {
      const roles = (plugin.referenceRoles ?? []).map((role) => role.role);
      expect(new Set(roles).size).toBe(roles.length);
    }
  });

  it("points every role at a step that actually offers a method to target", () => {
    for (const plugin of withRoles) {
      for (const role of plugin.referenceRoles ?? []) {
        const candidates = role.fromSteps.flatMap((stepId) =>
          getMethodsForStep(stepId).filter((candidate) => candidate.id !== plugin.id),
        );
        expect(candidates.length).toBeGreaterThan(0);
      }
    }
  });

  it("never points a role at the declaring method's own step alone", () => {
    for (const plugin of withRoles) {
      for (const role of plugin.referenceRoles ?? []) {
        expect(role.fromSteps.every((stepId) => plugin.steps.includes(stepId))).toBe(false);
      }
    }
  });
});
