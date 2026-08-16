import type { A3TextTone } from "../../a3/methodContract";

export type StatusTone = A3TextTone;

/**
 * D-41's shape half of the status marker (P-37) — the glyph carries the
 * primary meaning, the line's `tone` (see `methodContract.ts`) reinforces it
 * with colour. Fixed per §14.3: `positive` = done-ish (■), `caution` =
 * in progress/pending (●), `negative` = blocked/rejected (▲).
 */
const STATUS_GLYPHS: Readonly<Record<StatusTone, string>> = {
  positive: "■",
  caution: "●",
  negative: "▲",
};

export function statusGlyph(tone: StatusTone): string {
  return STATUS_GLYPHS[tone];
}

/** Prefixes `text` with the tone's glyph, e.g. `statusGlyphText("Approved", "positive")` → `"■ Approved"`. */
export function statusGlyphText(text: string, tone: StatusTone): string {
  return `${statusGlyph(tone)} ${text}`;
}
