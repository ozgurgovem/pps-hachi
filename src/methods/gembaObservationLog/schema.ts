import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): "Gemba observation log (date, place, observer,
 * what was seen, photos)." The four fixed fields live in `payload`
 * (`shared/fieldForm.ts`, D-127); `photos` is `Entry.images[]` — a plain,
 * unrolled, repeatable image slot (`imageSlots`, D-118/D-193), not a schema
 * field, mirroring how `references`/`roundId` also sit outside `payload`.
 */
export const GembaObservationLogPayloadSchema = z.looseObject({
  date: z.string(),
  place: z.string(),
  observer: z.string(),
  whatWasSeen: z.string(),
});

export type GembaObservationLogPayload = z.infer<typeof GembaObservationLogPayloadSchema>;
