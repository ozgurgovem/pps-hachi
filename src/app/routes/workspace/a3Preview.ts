import { buildA3Layout } from "../../../a3/buildA3Layout";
import type { A3LayoutDescriptor, ImagePlacement } from "../../../a3/descriptor";
import { rasterizePendingImages } from "../../../a3/render/rasterize";
import {
  resolveAnnotatedPhotoSpecs,
  resolveAssetImagePlacements,
  type AssetEntryBytes,
} from "../../../a3/render/resolveAssetImages";
import { getTemplateById } from "../../../a3/templates/registry";
import type { ProjectModel } from "../../../domain/model";
import { getA3ImageRendererMap, getA3RendererMap } from "../../../methods/registry";

/**
 * The composition root wiring `src/methods`' React-bearing plugin registry
 * into pure `buildA3Layout` (`src/a3`, D-43/D-94 — cannot import
 * `src/methods` itself). Faz 11/L1 (D-223): now genuinely reads
 * `project.templateId` through the template registry — Phase 4 through
 * Faz 10 always hardcoded `farplas7StepTr` here, so template selection was
 * dead code until this dilim (D-223's own §0 finding).
 *
 * D-102: async because a project with a chart/diagram entry needs a second,
 * impure pass — `buildA3Layout` discovers pending image geometry on the
 * first (pure) call, `rasterizePendingImages` bakes those specs to PNG
 * off-screen, and a second `buildA3Layout` call embeds the bytes. Projects
 * with no chart/diagram entries skip straight to the first call's result.
 *
 * D-118/D-193: `otherEntries` is the same in-memory array `useProjectStore`
 * already holds for `ppsx_write` — an `asset`-sourced pending slot (an
 * ingested photo, D-118) is resolved directly from those already-loaded
 * bytes (`resolveAssetImagePlacements`), never rasterized. `spec`-sourced
 * slots (charts/diagrams) keep going through `rasterizePendingImages`
 * unchanged — this is the "composition root's resolver forks" half of
 * D-118 point 4, `place.ts`'s geometry pass stays identical for both.
 */
export async function buildProjectA3Layout(
  project: ProjectModel,
  otherEntries: readonly AssetEntryBytes[] = [],
): Promise<A3LayoutDescriptor> {
  const rendererMap = getA3RendererMap();
  const template = getTemplateById(project.templateId);
  const first = buildA3Layout(project, template, { rendererMap });

  if (first.pendingImages.length === 0) {
    return first.descriptor;
  }

  const specSlots = first.pendingImages.filter((slot) => slot.source !== "asset");
  const assetSlots = first.pendingImages.filter((slot) => slot.source === "asset");

  // D-119: an "annotated-photo" slot's spec is a reference (assetImageId),
  // never bytes — place.ts stays pure. Resolve it to the bytes-included
  // AnnotatedPhotoRenderSpec the shared renderer draws before rasterizing;
  // every other spec-sourced slot passes through this step unchanged.
  const resolvedSpecSlots = resolveAnnotatedPhotoSpecs(specSlots, project, otherEntries);

  const rasterized = await rasterizePendingImages(resolvedSpecSlots, getA3ImageRendererMap());
  const assetImages = resolveAssetImagePlacements(assetSlots, project, otherEntries);
  const images: readonly ImagePlacement[] = [...rasterized, ...assetImages];

  return buildA3Layout(project, template, { rendererMap, images }).descriptor;
}
