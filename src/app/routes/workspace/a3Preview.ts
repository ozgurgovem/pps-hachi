import { buildA3Layout } from "../../../a3/buildA3Layout";
import type { A3LayoutDescriptor } from "../../../a3/descriptor";
import { rasterizePendingImages } from "../../../a3/render/rasterize";
import { farplas7StepTr } from "../../../a3/templates/farplas-7step-tr";
import type { ProjectModel } from "../../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../../../methods/registry";

/**
 * The composition root wiring `src/methods`' React-bearing plugin registry
 * into pure `buildA3Layout` (`src/a3`, D-43/D-94 — cannot import
 * `src/methods` itself). D-10: `farplas-7step-tr` is the only template
 * built in Phase 4; see DECISIONS.md for why `-plus`/`-en`/`pps-8step-auto`
 * wait for Phase 11.
 *
 * D-102: async because a project with a chart/diagram entry needs a second,
 * impure pass — `buildA3Layout` discovers pending image geometry on the
 * first (pure) call, `rasterizePendingImages` bakes those specs to PNG
 * off-screen, and a second `buildA3Layout` call embeds the bytes. Projects
 * with no chart/diagram entries skip straight to the first call's result.
 */
export async function buildProjectA3Layout(project: ProjectModel): Promise<A3LayoutDescriptor> {
  const rendererMap = getA3RendererMap();
  const first = buildA3Layout(project, farplas7StepTr, { rendererMap });

  if (first.pendingImages.length === 0) {
    return first.descriptor;
  }

  const images = await rasterizePendingImages(first.pendingImages, getA3ImageRendererMap());
  return buildA3Layout(project, farplas7StepTr, { rendererMap, images }).descriptor;
}
