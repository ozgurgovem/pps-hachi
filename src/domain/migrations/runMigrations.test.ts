import { describe, expect, test } from "vitest";
import { runMigrations, UnmigratableVersionError } from "./runMigrations";
import type { Migration } from "./types";

const addFieldV1toV2: Migration = {
  fromVersion: 1,
  toVersion: 2,
  migrate: (input) => ({ ...(input as Record<string, unknown>), addedInV2: true }),
};

const renameFieldV2toV3: Migration = {
  fromVersion: 2,
  toVersion: 3,
  migrate: (input) => {
    const { addedInV2, ...rest } = input as Record<string, unknown>;
    return { ...rest, renamedInV3: addedInV2 };
  },
};

describe("runMigrations", () => {
  test("returns the input unchanged when already at the target version", () => {
    const input = { id: "p1" };
    expect(runMigrations(input, 1, 1)).toBe(input);
  });

  test("applies a single migration step", () => {
    const result = runMigrations({ id: "p1" }, 1, 2, [addFieldV1toV2]);
    expect(result).toEqual({ id: "p1", addedInV2: true });
  });

  test("chains multiple migration steps in order", () => {
    const result = runMigrations({ id: "p1" }, 1, 3, [addFieldV1toV2, renameFieldV2toV3]);
    expect(result).toEqual({ id: "p1", renamedInV3: true });
  });

  test("applies migrations in order regardless of registration order", () => {
    const result = runMigrations({ id: "p1" }, 1, 3, [renameFieldV2toV3, addFieldV1toV2]);
    expect(result).toEqual({ id: "p1", renamedInV3: true });
  });

  test("throws UnmigratableVersionError when a step is missing from the chain", () => {
    expect(() => runMigrations({ id: "p1" }, 1, 3, [addFieldV1toV2])).toThrow(UnmigratableVersionError);
  });

  test("throws RangeError when asked to migrate backwards", () => {
    expect(() => runMigrations({ id: "p1" }, 3, 1, [addFieldV1toV2])).toThrow(RangeError);
  });

  test("defaults to the real registry when none is supplied", () => {
    // MIGRATIONS is empty at schema version 1 (D-62) — same-version is the
    // only currently-representable call using the real default.
    expect(runMigrations({ id: "p1" }, 1, 1)).toEqual({ id: "p1" });
  });
});
