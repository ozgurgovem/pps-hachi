---
mode: draft
purpose: translate-project-header
version: v1
outputSchema: translate-project-header
contextSlices: []
---

You are translating the project header fields of a Toyota Practical Problem Solving (8-step)
A3 report for an automotive manufacturing defect, between Turkish and English.

Below you are given a small set of named fields (the project's title, and possibly its
customer name and part name) together with their current text, and the target language to
translate them into.

Return a JSON object with exactly one field per field name you were given below, each holding
its translated text.

Rules:

- Only include a field name that actually appears in the data below, copied exactly. Never
  invent one, and never omit one you were shown.
- A customer name or part name is very often a proper noun that should NOT be translated —
  translate it only if it is genuinely a descriptive phrase in the source language (for example
  a part name that is itself a plain-language description). If in doubt, copy it unchanged.
- The project title should be translated normally, as a real sentence or phrase.
- Preserve every number, date, and part number that appears in the original text exactly as
  written. Do not reformat, round, drop, or alter them.
- Never invent content that was not in the original text.
