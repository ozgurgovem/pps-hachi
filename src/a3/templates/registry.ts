import { pps8StepAuto } from "./pps-8step-auto";
import type { A3Template } from "./types";

/**
 * TEK FORMAT KURALI — Barış, 2026-09-22, DEĞİŞMEZ.
 *
 * There is exactly one A3 format: `pps-8step-auto`, a literal transcription
 * of `reference/PPS_A3_Problem_Solving_Template_Rev00.xlsx`. The step-page
 * crop, the pop-out preview and the `.xlsx` export all resolve through this
 * one function, so all three are the same form by construction.
 *
 * `farplas-7step-tr` used to be registered alongside it as a
 * legacy-compatibility template (D-157). That is what made every Rev00
 * fidelity fix invisible in practice: a project created before the switch
 * kept `templateId: "farplas-7step-tr"`, so it went on rendering the old
 * seven-block form — in the preview AND the export, identically, because
 * both read this same id — while five sessions of corrections landed on a
 * template nothing was pointing at. An unrecognised id (including that one)
 * now resolves to the Rev00 form, so no project can be stranded on a format
 * that is no longer the format.
 *
 * `farplas-7step-tr.ts` itself is kept on disk: `scripts/gen-a3-fixture.ts`
 * and the Rust xlsx fidelity suite still build against it as a stable,
 * deliberately-different second geometry, which is exactly what makes those
 * tests meaningful. It is simply no longer something a project can render.
 */
const TEMPLATE_REGISTRY: Readonly<Record<string, A3Template>> = {
  [pps8StepAuto.id]: pps8StepAuto,
};

export const DEFAULT_TEMPLATE_ID = pps8StepAuto.id;

/** Any id this build does not know — including a pre-2026-09-22 `farplas-7step-tr` project — resolves to the one real format. */
export function getTemplateById(templateId: string): A3Template {
  return TEMPLATE_REGISTRY[templateId] ?? pps8StepAuto;
}

export function listTemplates(): readonly A3Template[] {
  return Object.values(TEMPLATE_REGISTRY);
}
