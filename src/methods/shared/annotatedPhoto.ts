import type { A3BlockContent, A3EntryAnnotation, A3EntrySummary, A3ImageRequest } from "../../a3/methodContract";
import { resolveA3Images } from "../../a3/methodContract";

/** Matches Pareto/Trend/`distributionChart`/`problem-impact`/`gemba-observation-log`'s own Step 1/2 convention. */
export const PHOTO_ROW_SPAN = 10;

/**
 * D-119: what `renderToA3` emits — a *reference*, never bytes. `place.ts`
 * (pure, D-43/D-94) only ever sees this as opaque `unknown`; the composition
 * root (`a3Preview.ts`/`resolveAssetImages.ts`) resolves `assetImageId` to
 * the photo's actual bytes before the off-screen rasterizer ever mounts a
 * renderer, producing an `AnnotatedPhotoRenderSpec` in its place.
 */
export interface AnnotatedPhotoSpec {
  readonly assetImageId: string;
  readonly annotations: readonly A3EntryAnnotation[];
}

/** What the shared renderer (`AnnotatedPhotoCanvas`) actually draws — bytes already resolved. */
export interface AnnotatedPhotoRenderSpec {
  readonly photoDataUrl: string;
  readonly mimeType: "image/jpeg" | "image/png";
  readonly annotations: readonly A3EntryAnnotation[];
}

/**
 * D-119: the branch shared by all three annotation-bearing methods
 * (`defect-photo-board`, `spaghetti-diagram`, `value-stream-map`) — written
 * once rather than three times, the same extraction discipline `fieldForm`/
 * `rowTable`/`whyChain`/`nodeTree` already established (D-127). An entry's
 * one photo routes through D-118's cheap direct `asset` path when it carries
 * no annotations, or becomes a `spec`-sourced `"annotated-photo"` slot (the
 * existing D-102 rasterize path, reused rather than reinvented) the moment
 * it has at least one. `title` is the block's own caption line, matching
 * `gemba-observation-log`/`before-after-photos`'s precedent of never adding
 * a redundant text field for something the entry's own title already says.
 */
export function renderAnnotatedPhotoBlock(entry: A3EntrySummary): A3BlockContent {
  const photo = resolveA3Images(entry)[0];
  if (!photo) {
    return { lines: [{ text: entry.title, bold: true }] };
  }

  const annotations = photo.annotations ?? [];
  const image: A3ImageRequest =
    annotations.length > 0
      ? {
          kind: "annotated-photo",
          spec: { assetImageId: photo.id, annotations } satisfies AnnotatedPhotoSpec,
          rowSpan: PHOTO_ROW_SPAN,
        }
      : {
          kind: "asset-photo",
          spec: undefined,
          source: "asset",
          assetImageId: photo.id,
          rowSpan: PHOTO_ROW_SPAN,
        };

  return { lines: [{ text: entry.title, bold: true }], image };
}
