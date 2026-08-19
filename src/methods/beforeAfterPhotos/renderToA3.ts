import type {
  A3BlockContent,
  A3ContentZone,
  A3EntryImageRef,
  A3EntrySummary,
  A3Language,
} from "../../a3/methodContract";
import { resolveA3Images, resolveA3Language } from "../../a3/methodContract";
import type { BeforeAfterPhotosPayload } from "./schema";

const ZONE_WIDTH_FRACTION = 0.5;

/** D-188/P-26: matches `methods.beforeAfterPhotos.{beforeLabel,afterLabel}`'s own editor translations. */
const BEFORE_LABEL: Readonly<Record<A3Language, string>> = { tr: "Önce", en: "Before" };
const AFTER_LABEL: Readonly<Record<A3Language, string>> = { tr: "Sonra", en: "After" };

function photoZone(
  label: string,
  titleLine: string | undefined,
  photo: A3EntryImageRef | undefined,
): A3ContentZone {
  const lines = titleLine ? [{ text: titleLine, bold: true }, { text: label }] : [{ text: label }];
  return {
    widthFraction: ZONE_WIDTH_FRACTION,
    lines,
    ...(photo
      ? {
          image: {
            kind: "asset-photo" as const,
            spec: undefined,
            source: "asset" as const,
            assetImageId: photo.id,
          },
        }
      : {}),
  };
}

/**
 * D-118/D-193: a static two-zone strip (D-38/`smartTarget`'s own pattern —
 * a fixed, known-in-advance zone count/fractions, not the dynamic-width
 * shape `gemba-observation-log` deliberately avoids). Each zone is
 * `asset`-sourced when its role's photo exists — never rasterized, the
 * bytes already exist (D-118 point 4).
 */
export function renderBeforeAfterPhotosToA3(
  _payload: BeforeAfterPhotosPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const images = resolveA3Images(entry);
  const before = images.find((image) => image.role === "before");
  const after = images.find((image) => image.role === "after");

  return {
    lines: [],
    zones: [
      photoZone(BEFORE_LABEL[language], entry.title, before),
      photoZone(AFTER_LABEL[language], undefined, after),
    ],
  };
}
