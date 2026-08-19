import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { gembaObservationLogMethod } from ".";
import { GembaObservationLogEditor } from "./Editor";
import type { GembaObservationLogPayload } from "./schema";

const EMPTY = gembaObservationLogMethod.createEmptyPayload() as GembaObservationLogPayload;

describe("GembaObservationLogEditor", () => {
  it("renders all four fields", () => {
    render(<GembaObservationLogEditor payload={EMPTY} onChange={vi.fn()} />);

    expect(screen.getByLabelText("Date")).toBeTruthy();
    expect(screen.getByLabelText("Place")).toBeTruthy();
    expect(screen.getByLabelText("Observer")).toBeTruthy();
    expect(screen.getByLabelText("What was seen")).toBeTruthy();
  });

  it("writes place back into the payload", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<GembaObservationLogEditor payload={EMPTY} onChange={onChange} />);

    await user.type(screen.getByLabelText("Place"), "x");

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY, place: "x" });
  });

  it("renders no image-upload UI itself — that lives in the generic EntryImagesField shell", () => {
    render(<GembaObservationLogEditor payload={EMPTY} onChange={vi.fn()} />);
    expect(screen.queryByRole("button", { name: /photo/i })).toBeNull();
  });
});
