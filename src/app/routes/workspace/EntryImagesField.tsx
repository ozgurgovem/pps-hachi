import { useState } from "react";
import { useTranslation } from "react-i18next";
import { open } from "@tauri-apps/plugin-dialog";
import type { Annotation, ImageRef } from "../../../domain/model";
import type { A3EntryAnnotation } from "../../../a3/methodContract";
import type { MethodImageSlot } from "../../../methods";
import { bytesToBase64 } from "../../../a3/render/resolveAssetImages";
import { useProjectStore } from "../../../state";
import { Button, DialogContent, DialogRoot } from "../../../ui";
import { errorMessage } from "../launch/errorMessage";
import { EntryAnnotationEditor } from "./EntryAnnotationEditor";

/**
 * D-118/D-193: `image` crate 0.25 (no HEIC/HEIF feature enabled — that
 * needs a separate `libheif` system dependency, out of this slice's budget,
 * P-44) decodes these. An iPhone set to "Most Compatible" already produces
 * JPEG; "High Efficiency" (the default) produces HEIC, which will fail at
 * import with a Rust decode error — a real, known gap, not silently
 * swallowed here, just not solved this slice.
 */
const IMAGE_FILTER = [
  { name: "Images", extensions: ["jpg", "jpeg", "png", "bmp", "tiff", "tif", "webp", "gif"] },
];

interface EntryImagesFieldProps {
  slots: readonly MethodImageSlot[];
  images: readonly ImageRef[];
  onChange: (images: readonly ImageRef[]) => void;
}

function matchesSlot(image: ImageRef, slot: MethodImageSlot): boolean {
  return slot.role === undefined ? image.role === undefined : image.role === slot.role;
}

/**
 * D-118/D-193's UI half, mirroring `EntryReferenceField`/`EntryRoundField`
 * (D-116/D-149(6d)): generic shell UI, driven by a method's declared
 * `imageSlots`, writing `Entry.images[]` directly rather than through
 * `payload`/`onChange`'s pure shape — an image import is a real Tauri IPC
 * round trip (`importEntryImage`), which no plugin `Editor` can express on
 * its own.
 *
 * Removing an image only unlinks the `ImageRef` — the underlying asset
 * bytes stay in the `.ppsx` as an orphan, the same "leave it, never build a
 * garbage collector this slice" posture D-117 already established for
 * dangling entry references.
 */
export function EntryImagesField({ slots, images, onChange }: EntryImagesFieldProps) {
  const { t } = useTranslation();
  const otherEntries = useProjectStore((s) => s.otherEntries);
  const [busySlotIndex, setBusySlotIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [annotatingImageId, setAnnotatingImageId] = useState<string | null>(null);

  async function handleAdd(slot: MethodImageSlot, slotIndex: number) {
    setError(null);
    const picked = await open({
      title: t("workspace.entryImages.pickDialogTitle"),
      filters: IMAGE_FILTER,
      multiple: false,
    });
    const sourcePath = Array.isArray(picked) ? picked[0] : picked;
    if (!sourcePath) {
      return;
    }

    setBusySlotIndex(slotIndex);
    try {
      const imported = await useProjectStore.getState().importEntryImage(sourcePath);
      const tagged: ImageRef = slot.role === undefined ? imported : { ...imported, role: slot.role };
      onChange([...images, tagged]);
      await useProjectStore.getState().saveNow();
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusySlotIndex(null);
    }
  }

  function handleRemove(imageId: string) {
    onChange(images.filter((image) => image.id !== imageId));
  }

  /**
   * `annotations` arrives as `A3EntryAnnotation[]` (what `AnnotatedPhotoCanvas`/
   * `EntryAnnotationEditor` actually emit — see their own comments); writing
   * it into `Entry.images[].annotations` needs the domain `Annotation[]`
   * shape, which structurally differs only in a type-level index signature
   * `z.looseObject` adds and TypeScript won't bridge automatically. The two
   * describe the same runtime JSON, so this is the one deliberate,
   * documented cast — the same "safe by construction" posture
   * `registerMethod`'s own erasure cast (`src/methods/types.ts`) already
   * uses for an analogous type-level-only mismatch.
   */
  function handleAnnotationsChange(imageId: string, annotations: readonly A3EntryAnnotation[]) {
    const asAnnotations = [...annotations] as unknown as Annotation[];
    onChange(images.map((image) => (image.id === imageId ? { ...image, annotations: asAnnotations } : image)));
  }

  function thumbnailSrc(image: ImageRef): string | undefined {
    const asset = otherEntries.find((entry) => entry.name === image.thumbnailPath);
    if (!asset) {
      return undefined;
    }
    return `data:image/jpeg;base64,${bytesToBase64(asset.bytes)}`;
  }

  return (
    <div className="flex flex-col gap-3">
      {slots.map((slot, slotIndex) => {
        const slotImages = images.filter((image) => matchesSlot(image, slot));
        const atMax = slotImages.length >= slot.max;
        return (
          <fieldset key={slot.role ?? "unrolled"} className="flex flex-col gap-2 rounded-control border border-border p-3">
            <legend className="px-1 font-display text-sm font-semibold">{t(slot.labelKey)}</legend>

            {slotImages.length > 0 && (
              <ul className="flex flex-wrap gap-2">
                {slotImages.map((image) => {
                  const src = thumbnailSrc(image);
                  return (
                    <li key={image.id} className="flex flex-col items-center gap-1">
                      <div className="relative">
                        {src ? (
                          <img
                            src={src}
                            alt=""
                            className="h-20 w-20 rounded-control border border-border object-cover"
                          />
                        ) : (
                          <div className="flex h-20 w-20 items-center justify-center rounded-control border border-border bg-surface-raised font-body text-2xs text-ink-muted">
                            {t("workspace.entryImages.thumbnailUnavailable")}
                          </div>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="absolute -right-1 -top-1"
                          onClick={() => handleRemove(image.id)}
                          aria-label={t("workspace.entryImages.remove")}
                        >
                          ×
                        </Button>
                      </div>
                      {slot.annotatable && (
                        <Button variant="ghost" size="sm" onClick={() => setAnnotatingImageId(image.id)}>
                          {t("workspace.entryImages.annotate")}
                        </Button>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            <Button
              variant="secondary"
              size="sm"
              onClick={() => void handleAdd(slot, slotIndex)}
              disabled={atMax || busySlotIndex !== null}
            >
              {busySlotIndex === slotIndex
                ? t("workspace.entryImages.importing")
                : t("workspace.entryImages.addPhoto")}
            </Button>
          </fieldset>
        );
      })}

      {error && (
        <p className="font-body text-sm text-danger" role="alert">
          {error}
        </p>
      )}

      <DialogRoot
        open={annotatingImageId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setAnnotatingImageId(null);
          }
        }}
      >
        {annotatingImageId !== null && (
          <DialogContent title={t("workspace.entryAnnotationEditor.title")} className="max-w-2xl">
            {(() => {
              const image = images.find((candidate) => candidate.id === annotatingImageId);
              if (!image) {
                return null;
              }
              return (
                <div className="flex flex-col gap-4">
                  <EntryAnnotationEditor
                    image={image}
                    onAnnotationsChange={(annotations) => handleAnnotationsChange(image.id, annotations)}
                  />
                  <div className="flex justify-end">
                    <Button onClick={() => setAnnotatingImageId(null)}>
                      {t("workspace.entryAnnotationEditor.done")}
                    </Button>
                  </div>
                </div>
              );
            })()}
          </DialogContent>
        )}
      </DialogRoot>
    </div>
  );
}
