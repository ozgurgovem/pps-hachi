import { describe, expect, it } from "vitest";
import { whyChainLines } from "./whyChain";

describe("whyChainLines", () => {
  it("numbers only the non-blank steps, in order", () => {
    const lines = whyChainLines([
      { id: "1", answer: "Yağ sızıntısı" },
      { id: "2", answer: "" },
      { id: "3", answer: "Conta aşınmış" },
    ]);
    expect(lines).toEqual([{ text: "Why 1: Yağ sızıntısı" }, { text: "Why 2: Conta aşınmış" }]);
  });

  it("returns an empty array for an all-blank chain", () => {
    expect(whyChainLines([{ id: "1", answer: "" }])).toEqual([]);
  });
});
