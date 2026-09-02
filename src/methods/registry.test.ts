import { describe, expect, it } from "vitest";
import { getPromptFile } from "../ai/prompts/library";
import { REFERENCE_ROLES, STEP_IDS, type StepId } from "../domain/model";
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
   * Four *referrers* shipped in 6b. D-114's 6b scope names five
   * reference-bearing methods: these four plus `point-of-cause`, which is
   * the chain's origin and so is only ever a target — it declares no roles
   * of its own. 6c adds two more, both reusing the existing `countermeasure`
   * role rather than a new mechanism: `error-proofing-hierarchy` and
   * `side-effect-risk-assessment` — the first two methods to reference an
   * entry in their *own* step (Step 5 rating/assessing a Step 5
   * countermeasure) rather than an earlier one. D-116 never restricted
   * references to cross-step, so this is a new case of an existing
   * mechanism, not a new one.
   */
  it("is declared by exactly the six methods that hold a reference", () => {
    expect(withRoles.map((plugin) => plugin.id).sort()).toEqual([
      "action-item",
      "countermeasure",
      "error-proofing-hierarchy",
      "hypothesis-verification",
      "ica-pca-transition",
      "side-effect-risk-assessment",
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

  /**
   * True for all four 6b referrers (each points backward at an earlier
   * step, following the causal chain). `error-proofing-hierarchy` and
   * `side-effect-risk-assessment` (6c) are the deliberate exceptions — both
   * Step 5 methods rating/assessing a Step 5 countermeasure — so both are
   * excluded here rather than silently breaking the assertion for everyone
   * else.
   */
  const SAME_STEP_REFERRERS = ["error-proofing-hierarchy", "side-effect-risk-assessment"];

  it("never points a role at the declaring method's own step alone, except the documented Step-5-rates-Step-5 cases", () => {
    for (const plugin of withRoles.filter((candidate) => !SAME_STEP_REFERRERS.includes(candidate.id))) {
      for (const role of plugin.referenceRoles ?? []) {
        expect(role.fromSteps.every((stepId) => plugin.steps.includes(stepId))).toBe(false);
      }
    }
  });
});

/**
 * D-169/C6: `tier` is additive and optional — unset must behave exactly like
 * `"more"` (D-51's loose-schema posture, applied to a TS field this time).
 * `genericText` deliberately never gets a `tier` (§2.2 of the C6 prompt), so
 * it is the one plugin registered on every step that must never appear as
 * `"recommended"` — and every step must have at least one method that does,
 * or `MethodBand`'s "Recommended" section would render empty on a fresh step.
 */
describe("MethodPlugin.tier (D-169)", () => {
  it("genericText never declares a tier — unset, not 'more'", () => {
    expect(getMethodById(GENERIC_TEXT_METHOD_ID)?.tier).toBeUndefined();
  });

  it("gives every step at least one recommended method", () => {
    for (const stepId of STEP_IDS) {
      const recommended = getMethodsForStep(stepId).filter((plugin) => plugin.tier === "recommended");
      expect(recommended.length).toBeGreaterThan(0);
    }
  });

  /**
   * D-169's own table, applied verbatim for Steps 1-3/5-6 (untouched this
   * slice) and Steps 7-8 (empty in D-169, filled in by C3/C4's real
   * plugins — re-derived from the live registry, not the spec's stale
   * count, per §1 point 5's own discipline). Step 4 is D-169 v2
   * (`AskUserQuestion`, C6, Option B): `whyWhyTree` added as a third
   * recommended alongside `fishbone`/`fiveWhy` — D-176's real evidence
   * surfaced by P-35, nothing removed.
   */
  it("matches D-169's per-step recommended set exactly", () => {
    const RECOMMENDED_BY_STEP: Record<StepId, readonly string[]> = {
      1: ["gap-statement", "five-n1k", "five-w2h"],
      2: ["stratification-matrix", "category-breakdown", "pareto", "trend"],
      3: ["smart-target"],
      4: ["fishbone", "five-why", "why-why-tree"],
      5: ["countermeasure", "weighted-decision-matrix"],
      6: ["action-item"],
      7: ["kpi-strip", "sustainment-audit"],
      8: ["document-updates-tracker", "yokoten-tracker", "lessons-learned"],
    };

    for (const stepId of STEP_IDS) {
      const recommendedIds = getMethodsForStep(stepId)
        .filter((plugin) => plugin.tier === "recommended")
        .map((plugin) => plugin.id)
        .sort();
      expect(recommendedIds).toEqual([...RECOMMENDED_BY_STEP[stepId]].sort());
    }
  });
});

/**
 * J1 (D-204) shipped one method (`pareto`) declaring `aiProposal`; J3
 * generalizes the same mechanism to the rest of the registry, one step at a
 * time. `aiProposal` is a *declaration* `EntryProposalField` acts on
 * generically (`getPromptFile(plugin.steps[0], plugin.id,
 * plugin.aiProposal.promptVersion)`), so the failure mode is silent the same
 * way an undeclared reference role was in D-116: a method claims a
 * `promptVersion` with no matching file on disk (a typo in the id, a
 * forgotten file, a version bump on one side but not the other) and nothing
 * short of clicking "AI ile öner" in a real window would ever notice —
 * `EntryProposalField`'s own tests never touch a specific method's prompt
 * file. One generic registry-wide invariant catches every method that
 * declares `aiProposal`, today's and every future slice's (J3-2..J3-8), so
 * this test never grows a duplicate for the next batch of methods.
 */
describe("MethodPlugin.aiProposal across the registry", () => {
  const withAiProposal = METHOD_REGISTRY.filter((plugin) => plugin.aiProposal !== undefined);

  it("has at least the methods J1/J3-1/J3-2 shipped", () => {
    const ids = withAiProposal.map((plugin) => plugin.id);
    expect(ids).toEqual(
      expect.arrayContaining([
        "pareto",
        "gap-statement",
        "five-g-5n1k",
        "five-n1k",
        "five-w2h",
        "trend",
        "point-of-cause",
        "distribution-chart",
      ]),
    );
  });

  it("resolves a real, loadable prompt file for every method that declares aiProposal, whose outputSchema matches the method's own id", () => {
    for (const plugin of withAiProposal) {
      const promptVersion = plugin.aiProposal?.promptVersion;
      expect(promptVersion, `${plugin.id} declares aiProposal with no promptVersion`).toBeTruthy();

      const firstStep = plugin.steps[0]!;
      const file = getPromptFile(firstStep, plugin.id, promptVersion as string);
      expect(file, `${plugin.id}: no prompt file found for step ${firstStep}, version "${promptVersion}"`).toBeDefined();
      expect(file?.frontMatter.outputSchema).toBe(plugin.id);
    }
  });
});
