import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 6): "Before / After photo pairs." No field beyond the
 * pair itself is named in SPEC, and the entry's own `title` (present on
 * every entry, D-01) already carries the caption/description — adding a
 * second, redundant text field here would be speculative (Anayasa's own
 * YAGNI rule). The two photos live in `Entry.images[]`, role-tagged
 * `"before"`/`"after"` (`imageSlots`, D-118/D-193), never in `payload`.
 */
export const BeforeAfterPhotosPayloadSchema = z.looseObject({});

export type BeforeAfterPhotosPayload = z.infer<typeof BeforeAfterPhotosPayloadSchema>;
