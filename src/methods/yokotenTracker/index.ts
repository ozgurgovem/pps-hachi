import type { MethodPlugin } from "../types";
import { YokotenTrackerEditor } from "./Editor";
import { renderYokotenTrackerToA3 } from "./renderToA3";
import { YokotenTrackerPayloadSchema, type YokotenTrackerPayload } from "./schema";

export const YOKOTEN_TRACKER_METHOD_ID = "yokoten-tracker";

export const yokotenTrackerMethod: MethodPlugin<YokotenTrackerPayload> = {
  id: YOKOTEN_TRACKER_METHOD_ID,
  steps: [8],
  tier: "recommended",
  nameKey: "methods.yokotenTracker.name",
  useWhenKey: "methods.yokotenTracker.useWhen",
  schema: YokotenTrackerPayloadSchema,
  Editor: YokotenTrackerEditor,
  createEmptyPayload: () => ({ rows: [] }),
  renderToA3: renderYokotenTrackerToA3,
  aiProposal: { promptVersion: "v1" },
};
