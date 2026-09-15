import type { Migration } from "./types";
import { v1ToV2SplitTpmMaintenance } from "./v1ToV2SplitTpmMaintenance";

/**
 * D-62: empty by design — schema version 1 had no predecessor, so there was
 * nothing to migrate from yet. Deliberately not seeded with an identity/
 * no-op v1 step: that would exercise nothing the real chain will ever do,
 * and would stand in for an "authentic v1 fixture" that can only be real if
 * it is never hand-written from memory (see the fixture corpus instead).
 *
 * D-267/P-66: the first real entry — `v1ToV2SplitTpmMaintenance`.
 */
export const MIGRATIONS: readonly Migration[] = [v1ToV2SplitTpmMaintenance];
