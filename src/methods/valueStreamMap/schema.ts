import { z } from "zod";

/**
 * SPEC.md §1.3 (Step 2): "Value Stream Map (image upload + annotation)." No
 * field beyond the map itself is named — the uploaded VSM photo/whiteboard
 * capture and the entry's own title carry everything this method needs,
 * matching `before-after-photos`/`defect-photo-board`/`spaghetti-diagram`'s
 * own precedent.
 */
export const ValueStreamMapPayloadSchema = z.looseObject({});

export type ValueStreamMapPayload = z.infer<typeof ValueStreamMapPayloadSchema>;
