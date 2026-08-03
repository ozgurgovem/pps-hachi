import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import "../../i18n";
import { TpmLossTaxonomyEditor } from "./Editor";
import type { TpmLossTaxonomyPayload } from "./schema";

function emptyPayload(): TpmLossTaxonomyPayload {
  const tag = { applies: false, severity: "low" as const };
  return {
    workSafety: { ...tag },
    cost: { ...tag },
    productivity: { ...tag },
    quality: { ...tag },
    maintenance: { ...tag },
    humanResources: { ...tag },
    environment: { ...tag },
  };
}

function ControlledEditor({
  initial,
  onChange,
}: {
  initial: TpmLossTaxonomyPayload;
  onChange: (payload: TpmLossTaxonomyPayload) => void;
}) {
  const [payload, setPayload] = useState(initial);
  return (
    <TpmLossTaxonomyEditor
      payload={payload}
      onChange={(next) => {
        setPayload(next);
        onChange(next);
      }}
    />
  );
}

describe("TpmLossTaxonomyEditor", () => {
  it("renders one checkbox per fixed TPM loss category", () => {
    render(<TpmLossTaxonomyEditor payload={emptyPayload()} onChange={vi.fn()} />);
    for (const label of ["Work Safety", "Cost", "Productivity", "Quality", "Maintenance", "Human Resources", "Environment"]) {
      expect(screen.getByLabelText(label)).toBeTruthy();
    }
  });

  it("toggling a category's checkbox flips only that category's applies flag", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(<ControlledEditor initial={emptyPayload()} onChange={onChange} />);

    await user.click(screen.getByLabelText("Quality"));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as TpmLossTaxonomyPayload;
    expect(lastCall.quality.applies).toBe(true);
    expect(lastCall.cost.applies).toBe(false);
  });

  it("changing a category's severity leaves its applies flag and other categories untouched", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const initial = { ...emptyPayload(), cost: { applies: true, severity: "low" as const } };
    render(<ControlledEditor initial={initial} onChange={onChange} />);

    await user.click(screen.getByRole("combobox", { name: /Cost —/ }));
    await user.click(await screen.findByRole("option", { name: "High" }));

    const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1]![0] as TpmLossTaxonomyPayload;
    expect(lastCall.cost).toEqual({ applies: true, severity: "high" });
    expect(lastCall.quality.applies).toBe(false);
  });
});
