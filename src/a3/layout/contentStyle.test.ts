import { describe, expect, it } from "vitest";
import { entryLineStyleId, resolveLineStyleId } from "./contentStyle";

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

describe("resolveLineStyleId (D-224)", () => {
  it("prefers an explicit fillStyleId over tone/bold resolution", () => {
    expect(resolveLineStyleId({ tone: "negative", fillStyleId: "bandPositive" })).toBe("bandPositive");
  });

  it("falls back to entryLineStyleId when fillStyleId is absent", () => {
    expect(resolveLineStyleId({ bold: true, tone: "caution" })).toBe("entryContentBoldCaution");
    expect(resolveLineStyleId({})).toBe("entryContent");
  });
});
