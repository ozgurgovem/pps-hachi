import { describe, expect, it } from "vitest";
import { formatSnapshotTimestamp } from "./timestamp";

describe("formatSnapshotTimestamp", () => {
  it("formats a UTC date with no colons or milliseconds", () => {
    const date = new Date("2026-08-02T14:15:30.123Z");
    expect(formatSnapshotTimestamp(date)).toBe("2026-08-02T141530Z");
  });

  it("is safe as a Windows filename component (D-75) — no colons", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(formatSnapshotTimestamp(date)).not.toContain(":");
  });
});
