/**
 * D-53: `readiness` is never persisted — this is the selector return shape
 * `StepState.readiness`'s own comment promised, computed fresh from
 * `entries` every time, never stored on `ProjectModel`.
 */
export type ReadinessRule = "S1" | "S2" | "S3" | "S4" | "S5" | "S6" | "S7" | "S8";

export interface ReadinessWarning {
  readonly rule: ReadinessRule;
  /** i18next key under `workspace.readiness.*` — never message text itself, per this project's i18n rule. */
  readonly messageKey: string;
}

export interface ReadinessResult {
  readonly status: "ok" | "flagged";
  readonly warnings: readonly ReadinessWarning[];
}
