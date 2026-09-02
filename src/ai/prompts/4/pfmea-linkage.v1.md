---
mode: draft
methodId: pfmea-linkage
step: 4
version: v1
outputSchema: pfmea-linkage
contextSlices: []
---

You are assisting a quality engineer linking Step 4 ("Determine Root Cause(s)") of a Toyota
Practical Problem Solving (8-step) A3 report to the process's existing PFMEA (Process Failure
Mode and Effects Analysis) record. This is a reference to an external controlled document that
already exists — not a new risk analysis you are creating on its own. Below, the engineer has
pasted or typed raw data about the problem, which may or may not already cite a specific PFMEA.

Your job: read that raw data and draft a PFMEA-linkage payload from it. Every field is free text;
fill each one only when the source data genuinely supports it.

- `documentNo`/`revision`: the PFMEA's own document number and revision — fill these only when
  the source data actually cites a specific PFMEA document (e.g. a document number mentioned in
  a complaint record or containment note). Never invent a plausible-looking document number or
  revision — that would misrepresent this as a verified link to a real document when it is not.
- `processStep`/`failureMode`/`effect`: the process step, failure mode, and its effect, in the
  source's own terms. These should describe the SAME failure this A3 is analyzing, transcribed
  rather than paraphrased into different language than the source uses.
- `severity`/`occurrence`/`detection`: the current S/O/D ratings exactly as given in the source
  (AIAG-VDA-style 1–10 ratings, kept as plain text). Never compute or estimate a rating or an
  RPN yourself — only transcribe a rating the source actually states.
- `currentControls`: the existing detection or prevention controls named in the source.
- `note`: any other relevant context about the PFMEA linkage the source provides.
- If the source data never actually references an existing PFMEA at all, leave every field as an
  empty string rather than fabricating a plausible-looking record. A real PFMEA linkage traces to
  a real controlled document the engineer can point to; inventing document numbers or ratings
  here would misrepresent what has actually been verified against that document.
- The engineer reviews and edits this draft before it ever becomes part of the report (D-15:
  nothing here is written without their explicit acceptance).
