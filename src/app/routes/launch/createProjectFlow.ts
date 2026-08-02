import { createNewProject, type CreateProjectParams, type Manifest, type ProjectModel } from "../../../domain/model";
import { upsertRecentProject, writePpsx } from "./ppsxIpc";
import { buildRecentEntryMeta } from "./recentEntry";

export interface CreateProjectOutcome {
  manifest: Manifest;
  project: ProjectModel;
  path: string;
  /** D-79: a brand-new project never has any — kept explicit for symmetry with `OpenProjectOutcome`. */
  otherEntries: [];
  /** D-77: pass through to the next `writePpsx` call as `expectedModifiedMs`. */
  modifiedMs: number;
}

/**
 * Unlike `openProjectAtPath`, a write failure here propagates as a normal
 * rejection rather than a `{ kind: "corrupt" }` outcome — there is no
 * "corrupt data" case for a project this function just constructed itself;
 * a failure here is an operational one (disk, permissions, path).
 */
export async function createProjectAtPath(path: string, params: CreateProjectParams): Promise<CreateProjectOutcome> {
  const { manifest, project } = createNewProject(params);

  const { modifiedMs } = await writePpsx(path, manifest, project, []);

  try {
    await upsertRecentProject(buildRecentEntryMeta(manifest, project, path));
  } catch {
    // Best-effort, same reasoning as openProjectFlow's recent-list write.
  }

  return { manifest, project, path, otherEntries: [], modifiedMs };
}
