import type { ProjectModel } from "../../domain/model";
import { findEntryImage } from "../../domain/selectors";
import type { ImagePlacement } from "../descriptor";
import type { PendingImageSlot } from "../layout/place";

/**
 * Mirrors `ArchiveEntryPayload`'s shape (`src/app/routes/launch/ppsxIpc.ts`)
 * structurally rather than importing it — `src/a3` stays inside the D-94
 * purity boundary (no dependency on the `src/app` layer), and the only
 * fields this module actually needs are these two.
 */
export interface AssetEntryBytes {
  readonly name: string;
  readonly bytes: readonly number[];
}

/** Exported for reuse by `EntryImagesField`'s thumbnail preview — same conversion, different caller. */
export function bytesToBase64(bytes: readonly number[]): string {
  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

/**
 * D-118/D-193: the "asset" half of the composition root's resolver fork —
 * `rasterizePendingImages` handles `spec`-sourced slots (charts/diagrams
 * needing a render+capture pass); this handles `asset`-sourced slots
 * (already-ingested photos, D-118) by looking up their already-in-memory
 * bytes and base64-encoding them directly. No rasterization, no off-screen
 * React mount — the bytes already exist.
 *
 * A slot whose image can't be resolved (a stale `assetImageId`, or
 * `otherEntries` not yet carrying its bytes) is skipped and logged, never
 * thrown — the same per-image failure isolation `rasterizePendingImages`
 * already established (D-109): one missing photo must not cost the whole
 * A3 preview/export.
 */
/**
 * D-119: the annotated-photo half of the composition root's resolver fork —
 * `renderAnnotatedPhotoBlock` (`src/methods/shared/annotatedPhoto.ts`) emits
 * a `"annotated-photo"` slot whose `spec` is a *reference*
 * (`AnnotatedPhotoSpec`, `{assetImageId, annotations}`), never bytes —
 * `place.ts` stays pure. This resolves that reference against `otherEntries`
 * (the same in-memory lookup `resolveAssetImagePlacements` already does) and
 * replaces `spec` with the bytes-included `AnnotatedPhotoRenderSpec` the
 * shared renderer (`AnnotatedPhotoCanvas`) actually draws — every other
 * slot kind passes through unchanged. An unresolvable reference (a stale
 * `assetImageId`, or `otherEntries` not yet carrying its bytes) is dropped
 * and logged rather than handed to the rasterizer with broken data, the
 * same per-image failure isolation `resolveAssetImagePlacements`/D-109
 * already establish.
 */
export function resolveAnnotatedPhotoSpecs(
  slots: readonly PendingImageSlot[],
  project: ProjectModel,
  otherEntries: readonly AssetEntryBytes[],
): readonly PendingImageSlot[] {
  const resolved: PendingImageSlot[] = [];

  for (const slot of slots) {
    if (slot.kind !== "annotated-photo") {
      resolved.push(slot);
      continue;
    }

    const spec = slot.spec as { assetImageId: string; annotations: unknown };
    const imageRef = findEntryImage(project, slot.entryId, spec.assetImageId);
    if (!imageRef) {
      console.error(
        `[a3] annotated photo "${spec.assetImageId}" for entry "${slot.entryId}" is not on that entry — skipping`,
      );
      continue;
    }

    const asset = otherEntries.find((candidate) => candidate.name === imageRef.assetPath);
    if (!asset) {
      console.error(
        `[a3] annotated photo bytes for "${imageRef.assetPath}" (entry "${slot.entryId}") are not loaded — skipping`,
      );
      continue;
    }

    resolved.push({
      ...slot,
      spec: {
        photoDataUrl: bytesToBase64(asset.bytes),
        mimeType: "image/jpeg",
        annotations: spec.annotations,
      },
    });
  }

  return resolved;
}

export function resolveAssetImagePlacements(
  slots: readonly PendingImageSlot[],
  project: ProjectModel,
  otherEntries: readonly AssetEntryBytes[],
): readonly ImagePlacement[] {
  const placements: ImagePlacement[] = [];

  for (const slot of slots) {
    if (slot.source !== "asset" || slot.assetImageId === undefined) {
      continue;
    }

    const imageRef = findEntryImage(project, slot.entryId, slot.assetImageId);
    if (!imageRef) {
      console.error(
        `[a3] asset image "${slot.assetImageId}" for entry "${slot.entryId}" is not on that entry — skipping`,
      );
      continue;
    }

    const asset = otherEntries.find((candidate) => candidate.name === imageRef.assetPath);
    if (!asset) {
      console.error(
        `[a3] asset image bytes for "${imageRef.assetPath}" (entry "${slot.entryId}") are not loaded — skipping`,
      );
      continue;
    }

    placements.push({
      id: `${slot.entryId}-${slot.assetImageId}`,
      data: bytesToBase64(asset.bytes),
      mimeType: "image/jpeg",
      anchorCell: slot.anchorCell,
      widthPt: slot.widthPt,
      heightPt: slot.heightPt,
    });
  }

  return placements;
}
