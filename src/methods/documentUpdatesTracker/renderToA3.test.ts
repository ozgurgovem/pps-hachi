import { describe, expect, it } from "vitest";
import type { DocumentUpdateRow } from "./schema";
import { renderDocumentUpdatesTrackerToA3 } from "./renderToA3";
import type { DocumentUpdatesTrackerPayload } from "./schema";

function blankRow(): DocumentUpdateRow {
  return {
    updateRequired: "",
    docId: "",
    revision: "",
    owner: "",
    dueDate: "",
    status: "",
    approval: "",
    evidence: "",
    customerSubmission: "",
  };
}

function allBlank(): DocumentUpdatesTrackerPayload {
  return {
    pfmea: blankRow(),
    controlPlan: blankRow(),
    workInstruction: blankRow(),
    inspectionStandard: blankRow(),
    trainingCompetence: blankRow(),
    layeredProcessAudit: blankRow(),
    apqpPpapRecord: blankRow(),
  };
}

describe("renderDocumentUpdatesTrackerToA3", () => {
  it("renders only the populated document types, each as a labelled sub-section", () => {
    const payload: DocumentUpdatesTrackerPayload = {
      ...allBlank(),
      pfmea: {
        updateRequired: "yes",
        docId: "PFMEA-004",
        revision: "Rev00 → Rev01",
        owner: "Quality Eng.",
        dueDate: "2026-09-01",
        status: "inProgress",
        approval: "underReview",
        evidence: "PFMEA-004-rev01.pdf",
        customerSubmission: "no",
      },
    };

    const content = renderDocumentUpdatesTrackerToA3(payload, { id: "e1", title: "Post-fix document updates" });

    expect(content.lines).toEqual([
      { text: "Post-fix document updates", bold: true },
      { text: "PFMEA", bold: true },
      { text: "Update required?: yes" },
      { text: "Doc ID: PFMEA-004" },
      { text: "Current → new revision: Rev00 → Rev01" },
      { text: "Owner: Quality Eng." },
      { text: "Due / completion date: 2026-09-01" },
      { text: "Status: inProgress" },
      { text: "Approval: underReview" },
      { text: "Evidence: PFMEA-004-rev01.pdf" },
      { text: "Customer submission?: no" },
    ]);
  });

  it("renders only the title line when no document type has any populated field", () => {
    const content = renderDocumentUpdatesTrackerToA3(allBlank(), { id: "e1", title: "Post-fix document updates" });
    expect(content.lines).toEqual([{ text: "Post-fix document updates", bold: true }]);
  });

  /** D-188/P-26: `entry.language` picks both the document-type heading and the field labels. */
  it("uses Turkish document-type headings and field labels when the entry's language is tr", () => {
    const payload: DocumentUpdatesTrackerPayload = {
      ...allBlank(),
      controlPlan: { ...blankRow(), docId: "CP-004", owner: "Kalite Müh." },
    };

    const content = renderDocumentUpdatesTrackerToA3(payload, {
      id: "e1",
      title: "Post-fix document updates",
      language: "tr",
    });

    expect(content.lines).toEqual([
      { text: "Post-fix document updates", bold: true },
      { text: "Kontrol Planı", bold: true },
      { text: "Doküman ID: CP-004" },
      { text: "Sorumlu: Kalite Müh." },
    ]);
  });
});
