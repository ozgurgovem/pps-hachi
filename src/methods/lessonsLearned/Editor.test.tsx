import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { lessonsLearnedMethod } from ".";
import { LessonsLearnedEditor } from "./Editor";
import type { LessonsLearnedPayload } from "./schema";

const EMPTY = lessonsLearnedMethod.createEmptyPayload() as LessonsLearnedPayload;

describe("LessonsLearnedEditor", () => {
  it("renders all eight fixed questions", () => {
    render(<LessonsLearnedEditor payload={EMPTY} onChange={vi.fn()} />);

    for (const label of [
      "What went well?",
      "What failed or was delayed?",
      "What evidence changed our thinking?",
      "What should be reused?",
      "What should be avoided?",
      "Coaching-capability lesson",
      "Customer communication lesson",
      "Final closure rationale",
    ]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("writes an answer back into the payload without touching the others", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<LessonsLearnedEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("What went well?"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, wentWell: "x" });
  });
});
