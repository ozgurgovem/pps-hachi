import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { StepTick } from "./StepTick";

describe("StepTick", () => {
  it("exposes progress via an accessible label, not color alone", () => {
    render(<StepTick total={8} current={3} />);
    expect(screen.getByRole("img", { name: "3 of 8 steps complete" })).toBeTruthy();
  });

  it("accepts a custom aria-label override", () => {
    render(<StepTick total={8} current={3} aria-label="Step 4 of 8" />);
    expect(screen.getByRole("img", { name: "Step 4 of 8" })).toBeTruthy();
  });
});
