import { describe, expect, it } from "vitest";
import { entryLineStyleId } from "./contentStyle";

describe("entryLineStyleId (P-37)", () => {
  it("returns the plain body/title style ids when no tone is given", () => {
    expect(entryLineStyleId(false, undefined)).toBe("entryContent");
    expect(entryLineStyleId(true, undefined)).toBe("entryContentBold");
    expect(entryLineStyleId(undefined, undefined)).toBe("entryContent");
  });

  it.each([
    ["positive", "entryContentPositive", "entryContentBoldPositive"],
    ["caution", "entryContentCaution", "entryContentBoldCaution"],
    ["negative", "entryContentNegative", "entryContentBoldNegative"],
  ] as const)("returns the %s tone's body/bold variant", (tone, bodyId, boldId) => {
    expect(entryLineStyleId(false, tone)).toBe(bodyId);
    expect(entryLineStyleId(true, tone)).toBe(boldId);
  });
});
