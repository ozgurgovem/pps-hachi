import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "./Button";

describe("Button", () => {
  it("renders as a native button with type=button by default", () => {
    render(<Button>Export A3</Button>);
    const button = screen.getByRole("button", { name: "Export A3" });
    expect(button.getAttribute("type")).toBe("button");
  });

  it("calls onClick when clicked", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Export A3</Button>);

    await user.click(screen.getByRole("button", { name: "Export A3" }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("does not fire onClick when disabled", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled>
        Export A3
      </Button>,
    );

    await user.click(screen.getByRole("button", { name: "Export A3" }));

    expect(onClick).not.toHaveBeenCalled();
  });
});
