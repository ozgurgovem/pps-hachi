export interface ProjectPriorityOption {
  readonly value: string;
  readonly labelKey: string;
}

/**
 * TEMPLATE_ANALYSIS.md §13.2 `Lists & Settings` — the reference form's own
 * `Priority` dictionary (Critical/High/Medium/Low), reused here for
 * `ProjectMetaSchema.priority` (Faz 11/L1, D-153's header identity band).
 * The schema field itself stays a plain string (not `z.enum`) per this
 * codebase's own established posture for status-like fields — this list is
 * what the Settings UI offers, not a runtime constraint.
 */
export const PROJECT_PRIORITY_OPTIONS = [
  { value: "critical", labelKey: "settings.projectInfo.priorityOptions.critical" },
  { value: "high", labelKey: "settings.projectInfo.priorityOptions.high" },
  { value: "medium", labelKey: "settings.projectInfo.priorityOptions.medium" },
  { value: "low", labelKey: "settings.projectInfo.priorityOptions.low" },
] as const satisfies readonly ProjectPriorityOption[];
