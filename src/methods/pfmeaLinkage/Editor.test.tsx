import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { pfmeaLinkageMethod } from ".";
import { PfmeaLinkageEditor } from "./Editor";
import type { PfmeaLinkagePayload } from "./schema";

const EMPTY = pfmeaLinkageMethod.createEmptyPayload() as PfmeaLinkagePayload;

describe("PfmeaLinkageEditor", () => {
  it("renders the document identity and the three ratings", () => {
    render(<PfmeaLinkageEditor payload={EMPTY} onChange={vi.fn()} />);

    for (const label of ["PFMEA no", "Revision", "Severity (S)", "Occurrence (O)", "Detection (D)"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("writes an edited rating back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<PfmeaLinkageEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Occurrence (O)"), "4");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, occurrence: "4" });
  });
});
