import type { ComponentType } from "react";
import type { ZodType } from "zod";
import type { StepId } from "../domain/model";

/**
 * D-07: every PPS method is a plugin. This type lives outside `src/domain/`
 * (not inside it) specifically because `Editor` is a React component — the
 * domain/a3 purity boundary (D-43) bans importing `react` from `src/domain`,
 * and a method registry that owns editor UI can never be pure in that sense.
 *
 * `renderToA3` and `readiness` are deliberately absent here. Phase 3 only
 * needs `schema` + `Editor` to prove the CRUD/reorder pipeline; the A3
 * renderer (Phase 4) and gate rules (Phase 7) add their own plugin fields
 * when those phases actually consume them, the same staged-rollout shape
 * D-52 already used for `Entry.payload`.
 */
export interface MethodEditorProps<TPayload> {
  payload: TPayload;
  onChange: (payload: TPayload) => void;
}

export interface MethodPlugin<TPayload> {
  readonly id: string;
  readonly steps: readonly StepId[];
  /** i18next key for the method's display name in the picker card. */
  readonly nameKey: string;
  /** i18next key for the picker card's one-line "use this when…" copy. */
  readonly useWhenKey: string;
  readonly schema: ZodType<TPayload>;
  readonly Editor: ComponentType<MethodEditorProps<TPayload>>;
  /** Produces a fresh, schema-valid payload for a brand-new entry. */
  readonly createEmptyPayload: () => TPayload;
}

/**
 * `MethodPlugin<X>` is not structurally assignable to `MethodPlugin<unknown>`
 * — `Editor`'s `onChange` puts `TPayload` in contravariant (function
 * parameter) position, so TypeScript correctly refuses to let an Editor that
 * requires an `X` payload be called with a merely-`unknown` one. A
 * heterogeneous registry needs the payload type erased at the boundary
 * instead. `registerMethod` is the one place that erasure happens; it is
 * safe by construction because the `payload` a registry consumer ever hands
 * back to a given plugin's `Editor`/`schema` always originated from that
 * same plugin (`createEmptyPayload`, or a value already round-tripped
 * through its own `schema`) — never a different plugin's shape.
 */
export type ErasedMethodPlugin = Omit<
  MethodPlugin<unknown>,
  "schema" | "Editor" | "createEmptyPayload"
> & {
  readonly schema: ZodType<unknown>;
  readonly Editor: ComponentType<MethodEditorProps<unknown>>;
  readonly createEmptyPayload: () => unknown;
};

export function registerMethod<TPayload>(plugin: MethodPlugin<TPayload>): ErasedMethodPlugin {
  return plugin as unknown as ErasedMethodPlugin;
}
