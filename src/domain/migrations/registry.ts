import type { Migration } from "./types";

/**
 * D-62: empty by design — schema version 1 has no predecessor, so there is
 * nothing to migrate from yet. Deliberately not seeded with an identity/
 * no-op v1 step: that would exercise nothing the real chain will ever do,
 * and would stand in for an "authentic v1 fixture" that can only be real if
 * it is never hand-written from memory (see the fixture corpus instead).
 * The first entry lands here the day `CURRENT_SCHEMA_VERSION` becomes 2.
 */
export const MIGRATIONS: readonly Migration[] = [];
