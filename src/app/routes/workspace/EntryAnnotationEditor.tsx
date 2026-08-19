import { useState } from "react";
import type { TFunction } from "i18next";
import { useTranslation } from "react-i18next";
import type { Annotation, AnnotationShape, ImageRef } from "../../../domain/model";
import type { A3EntryAnnotation } from "../../../a3/methodContract";
import { bytesToBase64 } from "../../../a3/render/resolveAssetImages";
import { AnnotatedPhotoCanvas } from "../../../methods/shared/AnnotatedPhotoCanvas";
import { useProjectStore } from "../../../state";
import { Button } from "../../../ui";

const TOOLS: readonly { shape: AnnotationShape; labelKey: string }[] = [
  { shape: "arrow", labelKey: "workspace.entryAnnotationEditor.toolArrow" },
  { shape: "circle", labelKey: "workspace.entryAnnotationEditor.toolCircle" },
  { shape: "callout", labelKey: "workspace.entryAnnotationEditor.toolCallout" },
  { shape: "path", labelKey: "workspace.entryAnnotationEditor.toolPath" },
];

function shapeLabel(t: TFunction, annotation: Annotation): string {
  switch (annotation.shape) {
    case "arrow":
      return t("workspace.entryAnnotationEditor.shapeArrow");
    case "circle":
      return t("workspace.entryAnnotationEditor.shapeCircle");
    case "callout":
      return t("workspace.entryAnnotationEditor.shapeCallout", { text: annotation.text ?? "" });
    case "path":
      return t("workspace.entryAnnotationEditor.shapePath");
    default:
      return annotation.shape;
  }
}

interface EntryAnnotationEditorProps {
  readonly image: ImageRef;
  /**
   * `A3EntryAnnotation`, not the domain `Annotation` — matches what
   * `AnnotatedPhotoCanvas` actually emits (see that file's own comment on
   * why). A real `Annotation` read off `image.annotations` above is always
   * assignable *into* this shape; the reverse (writing back into
   * `Entry.images[].annotations`) happens once, in `EntryImagesField.tsx`.
   */
  readonly onAnnotationsChange: (annotations: readonly A3EntryAnnotation[]) => void;
}

/**
 * D-119/6e-2's drawing surface — the generic shell UI Barış chose over a
 * per-method component (`AskUserQuestion`, this slice's own §2.2 round).
 * Draws over the photo's own full-resolution bytes (`assetPath`, not
 * `thumbnailPath` — precision matters here, unlike `EntryImagesField`'s
 * thumbnail preview), delegating the actual photo+overlay rendering and
 * pointer-drawing interaction to the shared `AnnotatedPhotoCanvas`
 * (D-102/D-103's dual-mode pattern). Keyboard/screen-reader users can
 * remove any placed shape from the list below even though placing one is
 * inherently pointer-driven — the same "canvas is mouse-only, but every
 * effect it has is separately reachable" posture `@dnd-kit` + explicit
 * move buttons already established for entry reordering (D-86).
 */
export function EntryAnnotationEditor({ image, onAnnotationsChange }: EntryAnnotationEditorProps) {
  const { t } = useTranslation();
  const otherEntries = useProjectStore((s) => s.otherEntries);
  const [tool, setTool] = useState<AnnotationShape>("arrow");

  const annotations = image.annotations ?? [];
  const asset = otherEntries.find((entry) => entry.name === image.assetPath);

  function handleRemove(id: string) {
    onAnnotationsChange(annotations.filter((annotation) => annotation.id !== id));
  }

  if (!asset) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2" role="group" aria-label={t("workspace.entryAnnotationEditor.title")}>
        {TOOLS.map(({ shape, labelKey }) => (
          <Button
            key={shape}
            type="button"
            size="sm"
            variant={tool === shape ? "primary" : "secondary"}
            aria-pressed={tool === shape}
            onClick={() => setTool(shape)}
          >
            {t(labelKey)}
          </Button>
        ))}
      </div>

      <AnnotatedPhotoCanvas
        photoDataUrl={bytesToBase64(asset.bytes)}
        mimeType="image/jpeg"
        annotations={annotations}
        interactive
        tool={tool}
        onAnnotationsChange={onAnnotationsChange}
      />

      {annotations.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">{t("workspace.entryAnnotationEditor.listEmpty")}</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {annotations.map((annotation) => (
            <li key={annotation.id} className="flex items-center justify-between gap-2">
              <span className="truncate font-body text-sm">{shapeLabel(t, annotation)}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleRemove(annotation.id)}
                aria-label={t("workspace.entryAnnotationEditor.removeAnnotation", { shape: shapeLabel(t, annotation) })}
              >
                ×
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
