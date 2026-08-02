import { z } from "zod";

/** D-08: `ProjectModel` is always 8-step, regardless of which template it renders to. */
export const STEP_IDS = [1, 2, 3, 4, 5, 6, 7, 8] as const;

export const StepIdSchema = z.union(STEP_IDS.map((id) => z.literal(id)));

export type StepId = (typeof STEP_IDS)[number];
