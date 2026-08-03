import type { IsIsNotPayload } from "./schema";

/** A literal tuple, not `Object.keys(...)` — see fiveG5N1K/renderToA3.ts's comment for why. */
export const IS_IS_NOT_DIMENSIONS = [
  ["what", "whatIs", "whatIsNot"],
  ["where", "whereIs", "whereIsNot"],
  ["when", "whenIs", "whenIsNot"],
  ["extent", "extentIs", "extentIsNot"],
] as const satisfies readonly (readonly [string, keyof IsIsNotPayload, keyof IsIsNotPayload])[];
