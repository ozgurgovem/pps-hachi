import { z } from "zod";

/**
 * TEMPLATE_ANALYSIS.md §14.2 / DECISIONS.md D-163: ADIM 1's 5N1K strip — a
 * fresh plugin, independent of the shipped `five-g-5n1k` (whose own field
 * set — `neKadar` instead of `neden`, plus 5G's five fields — does not match
 * `reference/visual/5N-1K.jpeg`). Field order matches that reference image:
 * Ne, Neden, Nasıl, Kim, Ne zaman, Nerede. Loose per D-51.
 */
export const FiveN1KPayloadSchema = z.looseObject({
  ne: z.string(),
  neden: z.string(),
  nasil: z.string(),
  kim: z.string(),
  neZaman: z.string(),
  nerede: z.string(),
});

export type FiveN1KPayload = z.infer<typeof FiveN1KPayloadSchema>;
