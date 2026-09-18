/**
 * BVVL round, ADIM 1 (2026-09-17): the diagram has a real but soft size
 * budget (`FiveN1KDiagram.tsx`), so an answer that runs long enough can
 * still spill past its own comfortable reading space. Per Barış's own
 * instruction, the Editor shows this as a live, non-blocking counter —
 * never a hard block, the stored answer is never truncated — while the
 * exported diagram itself truncates its own rendered text with an
 * ellipsis as a last-resort safety net (data stays intact either way).
 *
 * Real-app follow-up round 6 (2026-09-17, Barış's own reference image —
 * a horizontal chevron/list infographic): rounds 1/2/3/5 all tried to
 * raise this value while the diagram stayed a six-way RADIAL rosette,
 * each round finding a lower real ceiling than the last as the geometry
 * itself pushed back (35 → 50, still truncating real reference answers).
 * Round 6 replaced the rosette with a horizontal list — one full-width
 * row per question instead of a small radial slice — and this file's own
 * render probe found the real ceiling jumped to ~110-115 characters at
 * production size (283.5×156pt, six rows). 100 keeps real margin below
 * that; the real reference document's own six 5N1K answers (EK-2905's A3
 * Summary sheet, longest 40 characters) all render on a single line with
 * room to spare.
 */
export const FIVE_N1K_ANSWER_SOFT_LIMIT = 100;
