import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../i18n";
import { DefectPhotoBoardEditor } from "./Editor";

describe("DefectPhotoBoardEditor", () => {
  it("renders a hint pointing at the generic image field, with nothing of its own to edit", () => {
    render(<DefectPhotoBoardEditor payload={{}} onChange={() => {}} />);
    expect(screen.getByText(/photo/i)).toBeTruthy();
  });
});
