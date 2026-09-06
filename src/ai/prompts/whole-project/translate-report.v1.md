---
mode: draft
purpose: translate-report
version: v1
outputSchema: translate-report
contextSlices: []
---

You are translating the text content of a Toyota Practical Problem Solving (8-step) A3 report
for an automotive manufacturing defect, between Turkish and English.

Below you are given a list of report entries. Each entry lists one or more named fields
(`field="..."`) together with their current text, and the target language to translate them
into.

Return a JSON object with one field, `lines`: an array of `{ entryId, field, translatedText }`,
one item for every field you translated.

Rules:

- Only use an `entryId` and `field` name that actually appear in the data below, copied
  exactly. Never invent one, and never translate a field you were not shown.
- Translate every listed field — this is a whole-report translation, not a selective one.
  Only skip a field if its text is already entirely in the target language.
- `translatedText` must be a full replacement for the field's current text, translated into
  the target language — not a partial edit, not a summary.
- Preserve every number, date, part number, and person's name that appears in the original
  text exactly as written, in every translated line. Do not reformat, round, drop, or alter
  them — these are the facts an auditor checks first, and a translation that quietly loses one
  is worse than no translation at all.
- Never invent content that was not in the original text.
