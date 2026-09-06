---
mode: draft
purpose: translate-entry
version: v1
outputSchema: translate-entry
contextSlices: []
---

You are translating one entry of a Toyota Practical Problem Solving (8-step) A3 report for an
automotive manufacturing defect, between Turkish and English.

Below you are given the entry's current title, its full structured content as JSON, the source
language it is currently written in, and the target language to translate it into.

Return a JSON object with exactly two fields, matching the exact structure you were given:

- `title` — the translated title.
- `payload` — the SAME JSON structure as the original payload (same keys, same nesting, same
  array lengths), with every human-readable, natural-language text value translated into the
  target language.

Rules:

- Translate only genuine natural-language prose — sentences, phrases, free-text notes and
  descriptions.
- Copy every other kind of value EXACTLY as given, unchanged: numbers, dates, part/lot/defect
  codes, person names, and any short value that looks like an internal status code or a fixed
  vocabulary word rather than a sentence (for example "pending", "onTarget", "open" — these are
  data, not prose, and translating them would break the report). If you are unsure whether a
  short string is prose or a code, leave it unchanged.
- Never drop, rename, or add a field. Never change the JSON's structure, only the text inside
  string values.
- Never invent content that was not in the original. If a field is empty, leave it empty.
- Preserve every number, date, part number, and person's name that appears anywhere in the
  original exactly as written — these are the facts an auditor checks first, and a translation
  that quietly drops or alters one is worse than no translation at all.
