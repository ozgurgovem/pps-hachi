import type { MethodPlugin } from "../types";
import { IsIsNotEditor } from "./Editor";
import { renderIsIsNotToA3 } from "./renderToA3";
import { IsIsNotPayloadSchema, type IsIsNotPayload } from "./schema";

export const IS_IS_NOT_METHOD_ID = "is-is-not";

export const isIsNotMethod: MethodPlugin<IsIsNotPayload> = {
  id: IS_IS_NOT_METHOD_ID,
  steps: [2],
  nameKey: "methods.isIsNot.name",
  useWhenKey: "methods.isIsNot.useWhen",
  schema: IsIsNotPayloadSchema,
  Editor: IsIsNotEditor,
  createEmptyPayload: () => ({
    whatIs: "",
    whatIsNot: "",
    whereIs: "",
    whereIsNot: "",
    whenIs: "",
    whenIsNot: "",
    extentIs: "",
    extentIsNot: "",
  }),
  renderToA3: renderIsIsNotToA3,
};
