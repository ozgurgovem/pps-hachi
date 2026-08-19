import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import "../../i18n";
import { SpaghettiDiagramEditor } from "./Editor";

describe("SpaghettiDiagramEditor", () => {
  it("renders a hint pointing at the generic image field, with nothing of its own to edit", () => {
    render(<SpaghettiDiagramEditor payload={{}} onChange={() => {}} />);
    expect(screen.getByText(/photo/i)).toBeTruthy();
  });
});
