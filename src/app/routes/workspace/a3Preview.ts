import { buildA3Layout } from "../../../a3/buildA3Layout";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { farplas7StepTr } from "../../../a3/templates/farplas-7step-tr";
import type { ProjectModel } from "../../../domain/model";
import { getA3RendererMap } from "../../../methods/registry";

/**
 * The composition root wiring `src/methods`' React-bearing plugin registry
 * into pure `buildA3Layout` (`src/a3`, D-43/D-94 — cannot import
 * `src/methods` itself). D-10: `farplas-7step-tr` is the only template
 * built in Phase 4; see DECISIONS.md for why `-plus`/`-en`/`pps-8step-auto`
 * wait for Phase 11.
 */
export function buildProjectA3Layout(project: ProjectModel): A3LayoutDescriptor {
  return buildA3Layout(project, farplas7StepTr, { rendererMap: getA3RendererMap() });
}
