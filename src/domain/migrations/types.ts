/**
 * D-57: a migration takes and returns `unknown`, narrowing its own input
 * rather than typing against the live `ProjectModel` schema — a migration
 * typed against the current shape silently changes meaning every time that
 * shape is edited later, which is the most common way a migration chain
 * rots without anyone noticing. Each migration embeds a frozen copy of
 * whatever shape it depends on instead of importing it.
 */
export interface Migration {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(input: unknown): unknown;
}
