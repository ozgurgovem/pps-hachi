import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 1): "Defect photo board with annotation (arrows,
 * circles, callouts)." No field beyond the photo itself is named in SPEC,
 * matching `before-after-photos`' own precedent (D-193) — the entry's
 * `title` already carries the caption, and the annotated photo (or plain
 * photo) lives in `Entry.images[]`, never in `payload`.
 */
export const DefectPhotoBoardPayloadSchema = z.looseObject({});

export type DefectPhotoBoardPayload = z.infer<typeof DefectPhotoBoardPayloadSchema>;
