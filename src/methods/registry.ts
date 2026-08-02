import type { A3EntryRendererMap } from "../a3/methodContract";
import type { StepId } from "../domain/model";
import { genericTextMethod } from "./genericText";
import { registerMethod, type ErasedMethodPlugin } from "./types";

/**
 * D-07: adding a method must never require touching the step page, the
 * preview, or the exporter — this array is the one place a new plugin is
 * registered. Phase 3 ships exactly one plugin; Phase 5/6 add the rest.
 */
export const METHOD_REGISTRY: readonly ErasedMethodPlugin[] = [registerMethod(genericTextMethod)];

export function getMethodsForStep(stepId: StepId): readonly ErasedMethodPlugin[] {
  return METHOD_REGISTRY.filter((plugin) => plugin.steps.includes(stepId));
}

/** Returns `undefined` for a `methodId` this build doesn't recognize — see P-05. */
export function getMethodById(methodId: string): ErasedMethodPlugin | undefined {
  return METHOD_REGISTRY.find((plugin) => plugin.id === methodId);
}

/**
 * The composition-root bridge into `buildA3Layout` (`src/a3`, pure —
 * cannot import this file or anything React-tainted, D-43/D-94). Callers
 * that need the pure `A3EntryRendererMap` build it once from this registry
 * and pass it through `BuildA3LayoutOptions.rendererMap` instead of
 * `buildA3Layout` importing `src/methods` itself.
 */
export function getA3RendererMap(): A3EntryRendererMap {
  return Object.fromEntries(
    METHOD_REGISTRY.map((plugin) => [plugin.id, plugin.renderToA3] as const),
  );
}
