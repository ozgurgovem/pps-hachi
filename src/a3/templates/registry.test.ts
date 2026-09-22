import { describe, expect, it } from "vitest";
import { createNewProject } from "../../domain/model/createProject";
import { pps8StepAuto } from "./pps-8step-auto";
import { DEFAULT_TEMPLATE_ID, getTemplateById, listTemplates } from "./registry";

/**
 * Faz 11/L1 (D-223 §2.4): this dilim's one real new architecture mechanism.
 *
 * 2026-09-22 (TEK FORMAT KURALI): the registry now holds exactly one
 * template. `farplas-7step-tr` was de-registered, because a project still
 * carrying its id went on rendering the old form — preview and export
 * alike — while five sessions of Rev00 fidelity work landed on a template
 * nothing pointed at.
 */
describe("template registry (D-223)", () => {
  it("resolves the one registered template by id", () => {
    expect(getTemplateById("pps-8step-auto")).toBe(pps8StepAuto);
  });

  it("resolves a legacy or unrecognised templateId to the Rev00 form, so no project is stranded on a retired format", () => {
    expect(getTemplateById("farplas-7step-tr")).toBe(pps8StepAuto);
    expect(getTemplateById("some-future-template-this-build-has-never-heard-of")).toBe(pps8StepAuto);
    expect(getTemplateById("")).toBe(pps8StepAuto);
  });

  it("lists exactly the one registered template", () => {
    const templates = listTemplates();
    expect(templates).toHaveLength(1);
    expect(templates.map((t) => t.id)).toEqual(["pps-8step-auto"]);
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
