import { MIGRATIONS } from "./registry";
import type { Migration } from "./types";

export class UnmigratableVersionError extends Error {
  constructor(public readonly fromVersion: number) {
    super(`no migration path from schema version ${fromVersion}`);
    this.name = "UnmigratableVersionError";
  }
}

/**
 * Walks the migration chain from `fromVersion` up to `toVersion`, one
 * registered single-version step at a time. `toVersion` is a caller-supplied
 * parameter rather than reading `CURRENT_SCHEMA_VERSION` itself, so this
 * module never needs to import `src/domain/model` (D-57) — the caller
 * (outside `src/domain/migrations/`) is the one that knows both numbers.
 * `migrations` defaults to the real registry; tests inject a synthetic one.
 */
export function runMigrations(
  input: unknown,
  fromVersion: number,
  toVersion: number,
  migrations: readonly Migration[] = MIGRATIONS,
): unknown {
  if (fromVersion === toVersion) {
    return input;
  }
  if (fromVersion > toVersion) {
    throw new RangeError(`cannot migrate backwards from version ${fromVersion} to ${toVersion}`);
  }

  const byFromVersion = new Map(migrations.map((migration) => [migration.fromVersion, migration]));

  let current = input;
  let version = fromVersion;
  while (version < toVersion) {
    const migration = byFromVersion.get(version);
    if (!migration) {
      throw new UnmigratableVersionError(version);
    }
    current = migration.migrate(current);
    version = migration.toVersion;
  }

  return current;
}
