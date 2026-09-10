import { create } from "zustand";
import type { CompletionMeta } from "../ai/completionIpc";
import type { StepId } from "../domain/model";

/**
 * D-251 (Barış's own real-use report): once a response lands, "Apply the
 * suggestion" walks it through two structured calls (`chatEntryEdit.ts`)
 * before anything ever reaches `ProjectModel` — this sub-state tracks
 * exactly where in that walk a given "done" turn currently is. Moved here
 * from `AssistantPanel.tsx` (D-247's own original home for this type) only
 * so `Turn` — which embeds it — can live in the same store-owned file; the
 * shape itself is unchanged.
 */
export type ApplyState =
  | { readonly step: "locating" }
  | { readonly step: "noMatch" }
  | { readonly step: "proposing" }
  | {
      readonly step: "review";
      readonly targetEntryId: string;
      readonly methodId: string;
      readonly aiTitle: string;
      readonly aiPayload: unknown;
      readonly draftTitle: string;
      readonly draftPayload: unknown;
    }
  | { readonly step: "failed"; readonly rawText: string }
  | { readonly step: "error"; readonly message: string };

/**
 * D-245/D-251: one entry in a step's own conversation. `id` is a plain
 * `crypto.randomUUID()` (the same UI-layer-id convention every method
 * `Editor` already uses) — purely a lookup handle, never written to
 * `ProjectModel`.
 */
export type Turn =
  | {
      readonly id: string;
      readonly phase: "streaming";
      readonly prompt: string;
      readonly text: string;
      readonly conversationId: string | null;
      readonly streamId: string | null;
      readonly cancelling: boolean;
    }
  | {
      readonly id: string;
      readonly phase: "done";
      readonly prompt: string;
      readonly originalText: string;
      readonly editedText: string;
      readonly meta: CompletionMeta;
      readonly generatedAt: string;
      readonly applyState?: ApplyState | undefined;
    }
  | {
      readonly id: string;
      readonly phase: "error";
      readonly prompt: string;
      readonly message: string;
    }
  | {
      readonly id: string;
      readonly phase: "resolved";
      readonly prompt: string;
      readonly responseText: string;
      readonly resolution: "appliedToEntry" | "rejected";
    };

export interface StepChatState {
  readonly promptText: string;
  readonly turns: readonly Turn[];
  readonly lastConversationId: string | null;
}

const EMPTY_STEP_CHAT: StepChatState = { promptText: "", turns: [], lastConversationId: null };

interface AssistantChatStoreState {
  /** D-251: which project this chat data belongs to — see `syncProject`. */
  readonly projectId: string | null;
  readonly chatsByStep: Partial<Record<StepId, StepChatState>>;
  syncProject: (projectId: string) => void;
  setPromptText: (stepId: StepId, promptText: string) => void;
  setTurns: (stepId: StepId, updater: (prev: readonly Turn[]) => readonly Turn[]) => void;
  setLastConversationId: (stepId: StepId, conversationId: string | null) => void;
}

/**
 * D-251 (Barış's own real-use report): "any time I switch to a different
 * page, like Settings, the AI chat conversation disappears — everything is
 * lost, I have to type it all again." Root cause, confirmed by reading real
 * code: `AssistantPanel`'s conversation (`turns`/`promptText`/
 * `lastConversationId`) lived in plain `useState`, and `/project` and
 * `/settings` are two fully separate top-level routes (`router.tsx`) — react-
 * router unmounts the whole workspace element tree on that navigation, which
 * is a genuinely different, harder failure than a re-render: there is no
 * component left to hold the state at all. Fixed by moving that state out of
 * the component into this store, a plain module-level Zustand instance (the
 * same "external store, not tied to any one component's lifetime" shape
 * `useProjectStore` itself already is) — it survives exactly the kind of
 * full unmount/remount that was losing it, with zero change to when a real
 * autosave/undo/etc. effect starts or stops (those still correctly attach
 * only while `WorkspaceScreen` is mounted, per `workspaceEffects.ts`).
 *
 * Keyed by `StepId`, one bonus side effect of the same mechanism: switching
 * between steps (`<StepPage key={activeStepId}>`, D-219/W1) also remounts
 * `AssistantPanel`, and previously reset that step's conversation too, even
 * though nothing about the underlying bug report named step-switching —
 * this now naturally also survives, since each step's own chat lives at its
 * own key rather than in the remounted component's local state. This has no
 * real downside: it matches the step-scoped AI context `stepAiContext.ts`
 * already builds per step.
 *
 * `syncProject` guards against the one real correctness risk this
 * introduces — a store outside the component tree also outlives switching to
 * a *different* project within the same running session (close project A,
 * open project B, without quitting the app). Without a guard, project B's
 * step pages would show project A's stale conversation text, which is both
 * misleading and a P-51-adjacent content-leak concern. Idempotent by design
 * (a no-op `set()` when the id hasn't actually changed) so it's cheap to
 * call unconditionally on every `AssistantPanel` mount.
 */
export const useAssistantChatStore = create<AssistantChatStoreState>()((set, get) => ({
  projectId: null,
  chatsByStep: {},

  syncProject(projectId) {
    if (get().projectId === projectId) {
      return;
    }
    set({ projectId, chatsByStep: {} });
  },

  setPromptText(stepId, promptText) {
    set((state) => ({
      chatsByStep: {
        ...state.chatsByStep,
        [stepId]: { ...(state.chatsByStep[stepId] ?? EMPTY_STEP_CHAT), promptText },
      },
    }));
  },

  setTurns(stepId, updater) {
    set((state) => {
      const previous = state.chatsByStep[stepId] ?? EMPTY_STEP_CHAT;
      return {
        chatsByStep: { ...state.chatsByStep, [stepId]: { ...previous, turns: updater(previous.turns) } },
      };
    });
  },

  setLastConversationId(stepId, conversationId) {
    set((state) => ({
      chatsByStep: {
        ...state.chatsByStep,
        [stepId]: { ...(state.chatsByStep[stepId] ?? EMPTY_STEP_CHAT), lastConversationId: conversationId },
      },
    }));
  },
}));

/** Selector: this step's own chat state, or the shared empty default if it has none yet. */
export function selectStepChat(stepId: StepId) {
  return (state: AssistantChatStoreState): StepChatState => state.chatsByStep[stepId] ?? EMPTY_STEP_CHAT;
}
