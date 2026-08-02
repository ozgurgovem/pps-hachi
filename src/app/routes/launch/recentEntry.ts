import { z } from "zod";
import type { Manifest, ProjectModel } from "../../../domain/model";
import { STEP_IDS } from "../../../domain/model";
import { countStepsWithEntries } from "../projectProgress";

/**
 * The launch screen's recent list, per `SPEC.md` §2.1: title, customer,
 * owner, current step, last modified. Not part of the persisted `.ppsx`
 * format (D-51 doesn't apply) — this is a disposable cache the Rust side
 * (D-60) never inspects, so a strict shape is fine: a stale/incompatible
 * cached row is simply skipped rather than crashing the launch screen.
 *
 * No thumbnail field yet — a real one needs the A3 renderer (Phase 4).
 */
export const RecentEntryMetaSchema = z.object({
  path: z.string().min(1),
  title: z.string(),
  customer: z.string().optional(),
  owner: z.string().optional(),
  currentStep: z.number().int().min(0).max(STEP_IDS.length),
  lastModified: z.iso.datetime(),
});

export type RecentEntryMeta = z.infer<typeof RecentEntryMetaSchema>;

export function buildRecentEntryMeta(manifest: Manifest, project: ProjectModel, path: string): RecentEntryMeta {
  return {
    path,
    title: project.meta.title || "Untitled project",
    customer: project.meta.customer,
    owner: project.meta.owner.name || undefined,
    currentStep: countStepsWithEntries(project),
    lastModified: manifest.modified,
  };
}
