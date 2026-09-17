/**
 * BVVL round, ADIM 1 (2026-09-17): the diagram's satellite circles are a
 * fixed pixel size (`FiveN1KDiagram.tsx`), so an answer that runs long
 * would visually spill past its own circle. Per Barış's own instruction,
 * the Editor shows this as a live, non-blocking counter — never a hard
 * block, the stored answer is never truncated — while the exported
 * diagram itself truncates its own rendered text with an ellipsis as a
 * last-resort safety net (data stays intact either way).
 */
export const FIVE_N1K_ANSWER_SOFT_LIMIT = 50;
