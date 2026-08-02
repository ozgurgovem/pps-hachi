import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge } from "./Badge";

describe("Badge", () => {
  it("renders its label text for each status", () => {
    render(<Badge status="flagged">Flagged</Badge>);
    expect(screen.getByText("Flagged")).toBeTruthy();
  });
});
