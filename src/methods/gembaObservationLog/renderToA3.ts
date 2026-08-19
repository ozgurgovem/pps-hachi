import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { resolveA3Images, resolveA3Language } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { GEMBA_OBSERVATION_LOG_FIELDS } from "./fields";
import type { GembaObservationLogPayload } from "./schema";

/** Mirrors `pareto`/`trend`/`distributionChart`'s own Step 2 `CHART_ROW_SPAN` — same block, same budget. */
const PHOTO_ROW_SPAN = 10;

/**
 * D-118/D-193: `gembaObservationLogMethod.imageSlots` caps this method at
 * one untagged photo per entry (`max: 1`) — SPEC.md §1.3's plural "photos"
 * is honoured at the *entry* level instead (one Gemba walk observation =
 * one entry, D-124's own "one traceable node = one Entry" precedent), not
 * by stacking several images inside one block. `place.ts`'s vertical-stack
 * `image` mechanism only ever reserves room for one image per entry — an
 * `asset`-sourced request here, never rasterized (D-118 point 4).
 */
export function renderGembaObservationLogToA3(
  payload: GembaObservationLogPayload,
  entry: A3EntrySummary,
): A3BlockContent {
  const language = resolveA3Language(entry);
  const lines = [{ text: entry.title, bold: true }, ...fieldFormLines(payload, GEMBA_OBSERVATION_LOG_FIELDS, language)];

  const photo = resolveA3Images(entry)[0];
  if (!photo) {
    return { lines };
  }

  return {
    lines,
    image: {
      kind: "asset-photo",
      spec: undefined,
      source: "asset",
      assetImageId: photo.id,
      rowSpan: PHOTO_ROW_SPAN,
    },
  };
}
