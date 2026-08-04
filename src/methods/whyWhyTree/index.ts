import type { MethodPlugin } from "../types";
import { WhyWhyTreeEditor } from "./Editor";
import { renderWhyWhyTreeToA3 } from "./renderToA3";
import { WhyWhyTreePayloadSchema, type WhyWhyTreePayload } from "./schema";

export const WHY_WHY_TREE_METHOD_ID = "why-why-tree";

export const whyWhyTreeMethod: MethodPlugin<WhyWhyTreePayload> = {
  id: WHY_WHY_TREE_METHOD_ID,
  steps: [4],
  nameKey: "methods.whyWhyTree.name",
  useWhenKey: "methods.whyWhyTree.useWhen",
  schema: WhyWhyTreePayloadSchema,
  Editor: WhyWhyTreeEditor,
  createEmptyPayload: () => ({ nodes: [] }),
  renderToA3: renderWhyWhyTreeToA3,
};
