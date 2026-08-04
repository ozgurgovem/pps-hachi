import { z } from "zod";
import { FAULT_TREE_GATES } from "./gates";

/**
 * SPEC.md §1.3 (Step 4): Fault Tree Analysis with AND/OR gates. Same flat
 * `parentId` node list as the Why-Why tree (`shared/nodeTree.ts`), plus a
 * gate per node. Loose per D-51.
 */
export const FaultTreeNodeSchema = z.looseObject({
  id: z.string(),
  parentId: z.string().nullable(),
  text: z.string(),
  gate: z.enum(FAULT_TREE_GATES),
});

export const FaultTreePayloadSchema = z.looseObject({
  nodes: z.array(FaultTreeNodeSchema),
});

export type FaultTreeNode = z.infer<typeof FaultTreeNodeSchema>;
export type FaultTreePayload = z.infer<typeof FaultTreePayloadSchema>;
