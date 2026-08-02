import { CURRENT_SCHEMA_VERSION } from "./schemaVersion";
import type { Manifest } from "./manifest";
import type { ProjectModel } from "./projectModel";
import type { StepState } from "./stepState";

export interface CreateProjectParams {
  title: string;
  language: "tr" | "en";
  appVersion: string;
}

export interface NewProject {
  manifest: Manifest;
  project: ProjectModel;
}

function emptyStepState(): StepState {
  return { entries: [] };
}

/**
 * The only place a fresh `id` and `schemaVersion` are minted for both files
 * at once — D-54 requires `manifest` and `project.json` to agree on both,
 * and a mismatch is reported as corrupt, never reconciled. Building them
 * from one shared value here makes disagreement unrepresentable rather than
 * something a caller could get wrong.
 */
export function createNewProject({ title, language, appVersion }: CreateProjectParams): NewProject {
  const id = crypto.randomUUID();
  const now = new Date().toISOString();

  const manifest: Manifest = {
    id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    appVersion,
    created: now,
    modified: now,
  };

  const project: ProjectModel = {
    id,
    schemaVersion: CURRENT_SCHEMA_VERSION,
    meta: {
      title,
      projectCode: "",
      revision: "",
      owner: { name: "" },
      team: [],
      status: "draft",
      openedAt: now,
      language,
      ai: { enabled: false, redaction: {} },
    },
    // D-10: farplas-7step-tr is the default template until the Phase 4 fidelity test passes.
    templateId: "farplas-7step-tr",
    steps: {
      1: emptyStepState(),
      2: emptyStepState(),
      3: emptyStepState(),
      4: emptyStepState(),
      5: emptyStepState(),
      6: emptyStepState(),
      7: emptyStepState(),
      8: emptyStepState(),
    },
    signOff: {},
    rounds: [],
  };

  return { manifest, project };
}
