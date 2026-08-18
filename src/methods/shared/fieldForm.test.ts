import { describe, expect, it } from "vitest";
import { emptyFieldFormValues, fieldFormLines, type FieldFormField } from "./fieldForm";

type Key = "docNo" | "note" | "verdict";

const FIELDS = [
  { key: "docNo", labelKey: "l.docNo", exportLabel: { tr: "Doküman no", en: "Doc no" }, type: "text" },
  { key: "note", labelKey: "l.note", exportLabel: { tr: "Not", en: "Note" }, type: "textarea", wide: true },
  {
    key: "verdict",
    labelKey: "l.verdict",
    exportLabel: { tr: "Karar", en: "Verdict" },
    type: "select",
    options: [
      { value: "open", labelKey: "l.open" },
      { value: "closed", labelKey: "l.closed" },
    ],
  },
] as const satisfies readonly FieldFormField<Key>[];

describe("emptyFieldFormValues", () => {
  it("blanks every field and defaults a select to its first option", () => {
    expect(emptyFieldFormValues(FIELDS)).toEqual({ docNo: "", note: "", verdict: "open" });
  });

  it("leaves a select with no options blank rather than undefined", () => {
    const fields = [
      { key: "x", labelKey: "l", exportLabel: { tr: "X", en: "X" }, type: "select" },
    ] as const satisfies readonly FieldFormField<"x">[];

    expect(emptyFieldFormValues(fields)).toEqual({ x: "" });
  });
});

describe("fieldFormLines", () => {
  it("emits one labelled line per populated field, in declared order", () => {
    expect(
      fieldFormLines({ docNo: "PF-12", note: "watch cavity 3", verdict: "open" }, FIELDS, "en"),
    ).toEqual([{ text: "Doc no: PF-12" }, { text: "Note: watch cavity 3" }, { text: "Verdict: open" }]);
  });

  it("drops blank and whitespace-only fields", () => {
    expect(fieldFormLines({ docNo: "PF-12", note: "   ", verdict: "" }, FIELDS, "en")).toEqual([
      { text: "Doc no: PF-12" },
    ]);
  });

  it("trims the recorded value", () => {
    expect(fieldFormLines({ docNo: "  PF-12  ", note: "", verdict: "" }, FIELDS, "en")).toEqual([
      { text: "Doc no: PF-12" },
    ]);
  });

  it("uses the Turkish export label when the project language is tr", () => {
    expect(fieldFormLines({ docNo: "PF-12", note: "", verdict: "" }, FIELDS, "tr")).toEqual([
      { text: "Doküman no: PF-12" },
    ]);
  });
});
