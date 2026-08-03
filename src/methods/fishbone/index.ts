import { createElement } from "react";
import type { MethodPlugin } from "../types";
import { FishboneDiagram } from "./FishboneDiagram";
import { FishboneEditor } from "./Editor";
import { renderFishboneToA3 } from "./renderToA3";
import { FishbonePayloadSchema, type FishbonePayload } from "./schema";

export const FISHBONE_METHOD_ID = "fishbone";

export const fishboneMethod: MethodPlugin<FishbonePayload> = {
  id: FISHBONE_METHOD_ID,
  // D-11: Step 4 only, never Step 2.
  steps: [4],
  nameKey: "methods.fishbone.name",
  useWhenKey: "methods.fishbone.useWhen",
  schema: FishbonePayloadSchema,
  Editor: FishboneEditor,
  createEmptyPayload: () => ({ categorySet: "4M", causes: [] }),
  renderToA3: renderFishboneToA3,
  imageKind: "fishbone-diagram",
  renderImage: (spec, size) =>
    createElement(FishboneDiagram, { payload: spec as FishbonePayload, size }),
};
