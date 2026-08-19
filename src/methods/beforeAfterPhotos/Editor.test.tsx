import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../i18n";
import { BeforeAfterPhotosEditor } from "./Editor";

describe("BeforeAfterPhotosEditor", () => {
  it("renders a hint pointing at the generic image fields, with nothing of its own to edit", () => {
    render(<BeforeAfterPhotosEditor payload={{}} onChange={() => {}} />);
    expect(screen.getByText(/photo/i)).toBeTruthy();
  });
});
