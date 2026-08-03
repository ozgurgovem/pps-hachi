import { z } from "zod";

/**
 * SPEC.md §3.0: 5G (Gemba, Gembutsu, Genjitsu, Genri, Gensoku) + 5N1K
 * (Ne, Nerede, Nasıl, Ne zaman, Ne kadar, Kim) — the supplied Problem
 * Tanımlama Formu, replacing 5W2H as Step 1's default. Every field is
 * optional text (a field left blank during drafting is normal — D-52
 * validates at edit time, never load time), loose per D-51.
 */
export const FiveG5N1KPayloadSchema = z.looseObject({
  gemba: z.string(),
  gembutsu: z.string(),
  genjitsu: z.string(),
  genri: z.string(),
  gensoku: z.string(),
  ne: z.string(),
  nerede: z.string(),
  nasil: z.string(),
  neZaman: z.string(),
  neKadar: z.string(),
  kim: z.string(),
});

export type FiveG5N1KPayload = z.infer<typeof FiveG5N1KPayloadSchema>;
