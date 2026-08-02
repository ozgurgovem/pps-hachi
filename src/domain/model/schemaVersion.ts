/**
 * Bumped whenever `ProjectModel` or `Manifest` gains, removes or reshapes a
 * field. D-51: schemas stay loose (unknown keys survive a parse), so this
 * number — not the schema shape — is what a migration keys off.
 */
export const CURRENT_SCHEMA_VERSION = 1;
