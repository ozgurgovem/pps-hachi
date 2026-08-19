import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EntryReference, ImageRef, StepId } from "../../../domain/model";
import { buildAddEntryCommand, buildUpdateEntryCommand } from "../../../domain/commands";
import type { ErasedMethodPlugin } from "../../../methods";
import { useProjectStore } from "../../../state";
import { Button, DialogClose, DialogContent, DialogRoot, Input, Label } from "../../../ui";
import { EntryImagesField } from "./EntryImagesField";
import { EntryReferenceField } from "./EntryReferenceField";
import { EntryRoundField } from "./EntryRoundField";

export type EntryEditorMode =
  | { kind: "create" }
  | {
      kind: "edit";
      entryId: string;
      initialTitle: string;
      initialPayload: unknown;
      initialReferences?: readonly EntryReference[] | undefined;
      initialRoundId?: string | undefined;
      initialImages?: readonly ImageRef[] | undefined;
    };

/**
 * D-149(6d)/D-58: rounds iterate the step 4-7 analysis loop ("step-7 failure
 * → step-4 loop history", SPEC.md §4.2) — the picker only offers tagging on
 * the steps a round actually spans, so it doesn't show up as a confusing,
 * always-irrelevant control on Steps 1-3/8.
 */
const ROUND_TAGGABLE_STEPS: readonly StepId[] = [4, 5, 6, 7];

interface EntryEditorDialogProps {
  stepId: StepId;
  plugin: ErasedMethodPlugin;
  mode: EntryEditorMode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * D-84: editing an existing entry dispatches on every keystroke through
 * `dispatchCoalescedUpdate` — there is no "Save" button for edit mode, the
 * store already reflects whatever is on screen. Creating a new entry has
 * nothing to dispatch against yet, so it stays local state behind an
 * explicit "Save" that fires one `entry.insert` command.
 */
export function EntryEditorDialog({ stepId, plugin, mode, open, onOpenChange }: EntryEditorDialogProps) {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const dispatch = useProjectStore((s) => s.dispatch);
  const dispatchCoalescedUpdate = useProjectStore((s) => s.dispatchCoalescedUpdate);
  const sealTextEditCoalescing = useProjectStore((s) => s.sealTextEditCoalescing);

  const [createTitle, setCreateTitle] = useState("");
  const [createPayload, setCreatePayload] = useState<unknown>(() => plugin.createEmptyPayload());
  const [createReferences, setCreateReferences] = useState<readonly EntryReference[]>([]);
  const [createRoundId, setCreateRoundId] = useState<string | undefined>(undefined);
  const [createImages, setCreateImages] = useState<readonly ImageRef[]>([]);

  const isEdit = mode.kind === "edit";
  const title = isEdit ? mode.initialTitle : createTitle;
  const payload = isEdit ? mode.initialPayload : createPayload;
  const references = isEdit ? (mode.initialReferences ?? []) : createReferences;
  const roundId = isEdit ? mode.initialRoundId : createRoundId;
  const images = isEdit ? (mode.initialImages ?? []) : createImages;
  const step = project?.steps[stepId];

  function handleTitleChange(nextTitle: string) {
    if (mode.kind === "edit" && step) {
      const command = buildUpdateEntryCommand(step, stepId, mode.entryId, {
        title: nextTitle,
        payload,
        now: new Date().toISOString(),
      });
      dispatchCoalescedUpdate(command, `${stepId}:${mode.entryId}:title`);
      return;
    }
    setCreateTitle(nextTitle);
  }

  function handlePayloadChange(nextPayload: unknown) {
    if (mode.kind === "edit" && step) {
      const command = buildUpdateEntryCommand(step, stepId, mode.entryId, {
        title,
        payload: nextPayload,
        now: new Date().toISOString(),
      });
      dispatchCoalescedUpdate(command, `${stepId}:${mode.entryId}:payload`);
      return;
    }
    setCreatePayload(nextPayload);
  }

  /**
   * D-116: references live on the `Entry`, not in `payload`, so the picker
   * writes through this shell rather than through the plugin's Editor.
   * Unlike a keystroke, picking a reference is one discrete choice — it
   * dispatches directly instead of coalescing, so undo steps through
   * reference changes one at a time (D-84's rule applied to a non-text edit).
   */
  function handleReferencesChange(nextReferences: readonly EntryReference[]) {
    if (mode.kind === "edit" && step) {
      sealTextEditCoalescing();
      dispatch(
        buildUpdateEntryCommand(step, stepId, mode.entryId, {
          title,
          payload,
          now: new Date().toISOString(),
          references: nextReferences,
        }),
      );
      return;
    }
    setCreateReferences(nextReferences);
  }

  /** Same discrete-choice posture as `handleReferencesChange` — dispatches directly, no coalescing. */
  function handleRoundChange(nextRoundId: string | null) {
    if (mode.kind === "edit" && step) {
      sealTextEditCoalescing();
      dispatch(
        buildUpdateEntryCommand(step, stepId, mode.entryId, {
          title,
          payload,
          now: new Date().toISOString(),
          roundId: nextRoundId,
        }),
      );
      return;
    }
    setCreateRoundId(nextRoundId ?? undefined);
  }

  /** Same discrete-choice posture as `handleReferencesChange`/`handleRoundChange` — dispatches directly, no coalescing. */
  function handleImagesChange(nextImages: readonly ImageRef[]) {
    if (mode.kind === "edit" && step) {
      sealTextEditCoalescing();
      dispatch(
        buildUpdateEntryCommand(step, stepId, mode.entryId, {
          title,
          payload,
          now: new Date().toISOString(),
          images: nextImages,
        }),
      );
      return;
    }
    setCreateImages(nextImages);
  }

  function handleSave() {
    if (mode.kind === "create" && step) {
      const command = buildAddEntryCommand(step, stepId, {
        methodId: plugin.id,
        title: createTitle,
        payload: createPayload,
        now: new Date().toISOString(),
        references: createReferences,
        roundId: createRoundId,
        images: createImages,
      });
      dispatch(command);
      setCreateTitle("");
      setCreatePayload(plugin.createEmptyPayload());
      setCreateReferences([]);
      setCreateRoundId(undefined);
      setCreateImages([]);
    }
    onOpenChange(false);
  }

  function handleClose(nextOpen: boolean) {
    if (!nextOpen) {
      sealTextEditCoalescing();
    }
    onOpenChange(nextOpen);
  }

  const Editor = plugin.Editor;

  return (
    <DialogRoot open={open} onOpenChange={handleClose}>
      <DialogContent
        title={isEdit ? t("workspace.entryDialog.editTitle") : t("workspace.entryDialog.createTitle")}
      >
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="entry-title">{t("workspace.entryDialog.titleFieldLabel")}</Label>
            <Input
              id="entry-title"
              value={title}
              placeholder={t("workspace.entryDialog.titlePlaceholder")}
              onChange={(event) => handleTitleChange(event.target.value)}
              onBlur={sealTextEditCoalescing}
            />
          </div>

          <Editor payload={payload} onChange={handlePayloadChange} />

          {project && project.rounds.length > 0 && ROUND_TAGGABLE_STEPS.includes(stepId) && (
            <EntryRoundField rounds={project.rounds} value={roundId} onChange={handleRoundChange} />
          )}

          {plugin.imageSlots && plugin.imageSlots.length > 0 && (
            <EntryImagesField slots={plugin.imageSlots} images={images} onChange={handleImagesChange} />
          )}

          {project &&
            plugin.referenceRoles?.map((role) => (
              <EntryReferenceField
                key={role.role}
                project={project}
                role={role}
                references={references}
                onChange={handleReferencesChange}
                currentEntryId={mode.kind === "edit" ? mode.entryId : undefined}
              />
            ))}

          <div className="flex justify-end gap-2">
            <DialogClose asChild>
              <Button variant="secondary">
                {isEdit ? t("workspace.entryDialog.close") : t("workspace.entryDialog.cancel")}
              </Button>
            </DialogClose>
            {!isEdit && (
              <Button onClick={handleSave} disabled={createTitle.trim().length === 0}>
                {t("workspace.entryDialog.save")}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </DialogRoot>
  );
}
