import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): "Spaghetti diagram (image upload + annotation)."
 * No field beyond the diagram itself is named — the uploaded floor-plan
 * photo (traced with the `path` shape for material/people flow, D-119) and
 * the entry's own title carry everything this method needs, matching
 * `before-after-photos`/`defect-photo-board`'s own precedent.
 */
export const SpaghettiDiagramPayloadSchema = z.looseObject({});

export type SpaghettiDiagramPayload = z.infer<typeof SpaghettiDiagramPayloadSchema>;
