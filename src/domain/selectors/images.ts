import { STEP_IDS, type ImageRef, type ProjectModel } from "../model";

/**
 * D-118/D-193: an `Entry.images[]` id is unique within its own entry, not
 * globally — `entryId` narrows the search rather than being optional, the
 * same shape `place.ts`'s `PendingImageSlot.entryId` already carries
 * through from the block-placement pass that discovered this image request.
 */
export function findEntryImage(
  project: ProjectModel,
  entryId: string,
  imageId: string,
): ImageRef | undefined {
  for (const stepId of STEP_IDS) {
    const entry = project.steps[stepId].entries.find((candidate) => candidate.id === entryId);
    if (entry) {
      return entry.images.find((image) => image.id === imageId);
    }
  }
  return undefined;
}
