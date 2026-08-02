import { describe, expect, test } from "vitest";
import { checkMigrationChainContiguity } from "./chainContiguity";
import { MIGRATIONS } from "./registry";
import { CURRENT_SCHEMA_VERSION } from "../model/schemaVersion";
import type { Migration } from "./types";

function step(fromVersion: number, toVersion: number): Migration {
  return { fromVersion, toVersion, migrate: (input) => input };
}

describe("checkMigrationChainContiguity", () => {
  // D-62: the actual registry, checked against the actual current version —
  // this is the regression guard that fires the day someone bumps
  // CURRENT_SCHEMA_VERSION without adding the matching migration.
  test("the real registry is contiguous up to the real current schema version", () => {
    const result = checkMigrationChainContiguity(MIGRATIONS, CURRENT_SCHEMA_VERSION);
    expect(result).toEqual({ ok: true });
  });

  test("an empty registry is contiguous when current version is 1", () => {
    expect(checkMigrationChainContiguity([], 1)).toEqual({ ok: true });
  });

  test("accepts a complete 1->2->3 chain regardless of registration order", () => {
    const result = checkMigrationChainContiguity([step(2, 3), step(1, 2)], 3);
    expect(result).toEqual({ ok: true });
  });

  test("rejects a chain with a gap", () => {
    const result = checkMigrationChainContiguity([step(1, 2), step(3, 4)], 4);
    expect(result.ok).toBe(false);
  });

  test("rejects a chain with a duplicate fromVersion", () => {
    const result = checkMigrationChainContiguity([step(1, 2), step(1, 2)], 3);
    expect(result.ok).toBe(false);
  });

  test("rejects a migration that skips a version", () => {
    const result = checkMigrationChainContiguity([step(1, 3)], 3);
    expect(result.ok).toBe(false);
  });

  test("rejects too few migrations for the current version", () => {
    const result = checkMigrationChainContiguity([step(1, 2)], 4);
    expect(result.ok).toBe(false);
  });

  test("rejects too many migrations for the current version", () => {
    const result = checkMigrationChainContiguity([step(1, 2), step(2, 3)], 2);
    expect(result.ok).toBe(false);
  });
});
