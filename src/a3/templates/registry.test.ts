import { describe, expect, it } from "vitest";
import { createNewProject } from "../../domain/model/createProject";
import { farplas7StepTr } from "./farplas-7step-tr";
import { pps8StepAuto } from "./pps-8step-auto";
import { DEFAULT_TEMPLATE_ID, getTemplateById, listTemplates } from "./registry";

/**
 * Faz 11/L1 (D-223 §2.4): this dilim's one real new architecture mechanism.
 */
describe("template registry (D-223)", () => {
  it("resolves both registered templates by id", () => {
    expect(getTemplateById("farplas-7step-tr")).toBe(farplas7StepTr);
    expect(getTemplateById("pps-8step-auto")).toBe(pps8StepAuto);
  });

  it("falls back to farplas-7step-tr for an unrecognised templateId (D-52/P-05's own graceful-degradation posture)", () => {
    expect(getTemplateById("some-future-template-this-build-has-never-heard-of")).toBe(farplas7StepTr);
    expect(getTemplateById("")).toBe(farplas7StepTr);
  });

  it("lists exactly the two registered templates", () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(2);
    expect(templates.map((t) => t.id).sort()).toEqual(["farplas-7step-tr", "pps-8step-auto"]);
  });

  it("D-157: DEFAULT_TEMPLATE_ID is pps-8step-auto, and matches what createNewProject actually writes", () => {
    expect(DEFAULT_TEMPLATE_ID).toBe("pps-8step-auto");
    const { project } = createNewProject({ title: "x", language: "tr", appVersion: "0.1.0" });
    // createProject.ts can't import this registry (src/domain must not
    // depend on src/a3) so its own templateId is a literal — this is the
    // one place that literal is cross-checked against the registry's own
    // constant, so the two can never silently drift apart.
    expect(project.templateId).toBe(DEFAULT_TEMPLATE_ID);
  });
});
