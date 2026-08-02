import type { Migration } from "./types";

export type ChainContiguityResult = { ok: true } | { ok: false; reason: string };

/**
 * D-62's invariant: registered migrations must form an unbroken chain
 * `1 -> 2 -> ... -> currentSchemaVersion`, one single-version step at a
 * time, no gaps and no duplicates. Order of registration doesn't matter —
 * this sorts before checking.
 */
export function checkMigrationChainContiguity(
  migrations: readonly Migration[],
  currentSchemaVersion: number,
): ChainContiguityResult {
  if (!Number.isInteger(currentSchemaVersion) || currentSchemaVersion < 1) {
    return { ok: false, reason: `CURRENT_SCHEMA_VERSION must be a positive integer, got ${currentSchemaVersion}` };
  }

  const expectedCount = currentSchemaVersion - 1;
  if (migrations.length !== expectedCount) {
    return {
      ok: false,
      reason: `expected ${expectedCount} migration(s) to reach schema version ${currentSchemaVersion}, found ${migrations.length}`,
    };
  }

  const sorted = [...migrations].sort((a, b) => a.fromVersion - b.fromVersion);
  for (let index = 0; index < sorted.length; index += 1) {
    const expectedFrom = index + 1;
    const migration = sorted[index];
    const isContiguousStep = migration?.fromVersion === expectedFrom && migration?.toVersion === expectedFrom + 1;
    if (!isContiguousStep) {
      const found = migration ? `${migration.fromVersion} -> ${migration.toVersion}` : "nothing";
      return {
        ok: false,
        reason: `expected a migration from version ${expectedFrom} to ${expectedFrom + 1}, found ${found}`,
      };
    }
  }

  return { ok: true };
}
