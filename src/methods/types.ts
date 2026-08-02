import type { ComponentType } from "react";
import type { ZodType } from "zod";
import type { A3BlockContent, A3EntrySummary } from "../a3/methodContract";
import type { StepId } from "../domain/model";

/**
 * D-07: every PPS method is a plugin. This type lives outside `src/domain/`
 * (not inside it) specifically because `Editor` is a React component — the
 * domain/a3 purity boundary (D-43) bans importing `react` from `src/domain`,
 * and a method registry that owns editor UI can never be pure in that sense.
 *
 * `renderToA3` was added in Phase 4 (`src/a3/methodContract.ts` — a pure,
 * React-free contract `buildA3Layout` depends on instead of on this file
 * directly, keeping `src/a3` inside the D-43/D-94 purity boundary).
 * `readiness` (Phase 7's gate rules) is still deliberately absent, the same
 * staged-rollout shape D-52 already used for `Entry.payload`.
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
  /** Renders this method's payload into the A3 sheet — see `src/a3/methodContract.ts`. */
  readonly renderToA3: (payload: TPayload, entry: A3EntrySummary) => A3BlockContent;
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
  "schema" | "Editor" | "createEmptyPayload" | "renderToA3"
> & {
  readonly schema: ZodType<unknown>;
  readonly Editor: ComponentType<MethodEditorProps<unknown>>;
  readonly createEmptyPayload: () => unknown;
  readonly renderToA3: (payload: unknown, entry: A3EntrySummary) => A3BlockContent;
};

export function registerMethod<TPayload>(plugin: MethodPlugin<TPayload>): ErasedMethodPlugin {
  return plugin as unknown as ErasedMethodPlugin;
}
