/**
 * Bumped whenever `ProjectModel` or `Manifest` gains, removes or reshapes a
 * field. D-51: schemas stay loose (unknown keys survive a parse), so this
 * number — not the schema shape — is what a migration keys off.
 *
 * D-267/P-66: version 2 is the first real migration ever registered
 * (`src/domain/migrations/v1ToV2SplitTpmMaintenance.ts`) — it splits a
 * `tpm-loss-taxonomy` entry's old `maintenance` tag into
 * `autonomousMaintenance`/`professionalMaintenance`.
 */
export const CURRENT_SCHEMA_VERSION = 2;
