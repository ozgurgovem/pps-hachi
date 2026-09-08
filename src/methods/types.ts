import type { ComponentType, ReactNode } from "react";
import type { ZodType } from "zod";
import type { A3BlockContent, A3EntrySummary, A3ImageKind, A3ImageSize } from "../a3/methodContract";
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

/**
 * D-116: a method **declares** which cross-step relations its entries hold;
 * it never renders the picker itself. The picker is generic, lives in the
 * workspace shell beside the title field, and writes `Entry.references[]` —
 * which sits outside `payload` and therefore outside `MethodEditorProps`
 * entirely. That split is the point of the decision: a reference stays
 * visible to generic code (orphan detection, Phase 7's traceability view)
 * without any of that code knowing one method's payload shape.
 *
 * `fromSteps` scopes the candidate list. A countermeasure targets root
 * causes, which live in Step 4 — offering it every entry in the project
 * would make the right choice harder to find, not easier.
 */
export interface MethodReferenceRole {
  /** One of `REFERENCE_ROLES`, or a new documented constant. */
  readonly role: string;
  /** i18next key for the field label ("Addresses root cause"). */
  readonly labelKey: string;
  /** i18next key for the empty-state line under the field. */
  readonly emptyKey: string;
  /** Which steps' entries may be targeted. */
  readonly fromSteps: readonly StepId[];
  /** `false` narrows the field to a single target, replacing on each pick. */
  readonly multiple: boolean;
}

/**
 * D-118/D-193: a method **declares** how many ingested photos it holds and
 * whether they're role-tagged — it never renders the upload UI itself,
 * mirroring `MethodReferenceRole`'s split (D-116) and for the same reason:
 * the picker needs a Tauri IPC round-trip (`useProjectStore`'s
 * `importEntryImage`) that `MethodEditorProps`'s pure `{payload, onChange}`
 * shape cannot express, so it lives in the generic shell
 * (`EntryImagesField`, beside the title field in `EntryEditorPanel`) and
 * writes `Entry.images[]` directly.
 *
 * `role` is `undefined` for a plain, unrolled, repeatable slot (Gemba's
 * "photos", `max` > 1); set for a fixed, single-purpose slot (Before/After's
 * two `max: 1` roled slots). A method with no `imageSlots` accepts no
 * photos at all — the same "absent = not applicable" posture
 * `referenceRoles` already uses.
 *
 * D-119/6e-2: `annotatable` opts a slot into `EntryImagesField`'s "Annotate"
 * trigger (opens the shared `EntryAnnotationEditor`, which draws over
 * `Entry.images[].annotations`). Unset/`false` for the great majority of
 * slots — Gemba's/Before-After's photos are plain records, never annotated.
 */
export interface MethodImageSlot {
  readonly role?: string;
  /** i18next key for the slot's label ("Photos", "Before", "After"). */
  readonly labelKey: string;
  /** Maximum images this slot accepts. */
  readonly max: number;
  readonly annotatable?: boolean;
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
  /**
   * D-102: the `A3ImageKind` this plugin's `renderToA3` may request via
   * `A3BlockContent.image`/`.zones[].image`, paired with the React node
   * that actually draws it (mounted off-screen and rasterized to PNG by
   * `src/a3/render/rasterize.ts` — never called from `src/a3` directly,
   * only injected via `src/methods/registry.ts`'s `getA3ImageRendererMap`,
   * same dependency-injection shape D-99 already uses for `renderToA3`
   * itself). Absent for text-only methods.
   */
  readonly imageKind?: A3ImageKind;
  /**
   * Draws into the **explicit** `size` box the rasterizer gives it. A chart
   * that instead sizes itself from a measured parent (Recharts'
   * `ResponsiveContainer`, React Flow's `fitView`) renders nothing until a
   * ResizeObserver cycle completes and would export as a blank PNG — see
   * `src/a3/render/rasterize.ts`.
   */
  readonly renderImage?: (spec: unknown, size: A3ImageSize) => ReactNode;
  /**
   * D-116: the cross-step relations an entry of this method may hold.
   * Absent for the great majority of methods — including the Step 4 PFMEA
   * linkage, whose "reference" is to an external document and belongs in
   * `meta.linkedRecords[]` (SPEC.md §4.2), not to another entry.
   */
  readonly referenceRoles?: readonly MethodReferenceRole[] | undefined;
  /**
   * D-169: which of `MethodBand`'s two sections this plugin's card renders
   * in by default. Unset counts as `"more"` — additive, backward compatible,
   * no migration, same posture as `referenceRoles` above. An editorial
   * default, not a frozen list — see `DECISIONS.md` D-169/D-186.
   */
  readonly tier?: "recommended" | "more";
  /** D-118/D-193: which image slots this method's entries accept — see `MethodImageSlot`. */
  readonly imageSlots?: readonly MethodImageSlot[] | undefined;
  /**
   * J1/§2.4: the fourth application of D-125's "declare, don't render"
   * pattern (after `referenceRoles`/`imageSlots`/`tier`) — a method opts
   * into the generic "AI ile öner" trigger (`EntryProposalField`, beside
   * the title field in `EntryEditorPanel`) by naming which prompt-library
   * file version to use. The file itself lives at
   * `src/ai/prompts/{step}/{id}.{promptVersion}.md` (SPEC.md §8.7) — the
   * method never touches Vorion, JSON Schema conversion, or the Accept
   * flow directly, mirroring how a plugin never renders its own reference
   * picker or image uploader.
   */
  readonly aiProposal?: { readonly promptVersion: string } | undefined;
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
