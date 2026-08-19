import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from "@dnd-kit/sortable";
import type { Entry, StepId } from "../../../domain/model";
import {
  buildDeleteEntryCommand,
  buildDuplicateEntryCommand,
  buildReorderCommand,
  buildSetA3VisibilityCommand,
} from "../../../domain/commands";
import { roundOrdinal } from "../../../domain/selectors";
import { getMethodById } from "../../../methods";
import { useProjectStore } from "../../../state";
import { Button, DialogContent, DialogRoot } from "../../../ui";
import { EntryEditorDialog } from "./EntryEditorDialog";
import { EntryRow } from "./EntryRow";
import { SortableEntryRow } from "./SortableEntryRow";

interface EntriesBandProps {
  stepId: StepId;
}

export function EntriesBand({ stepId }: EntriesBandProps) {
  const { t } = useTranslation();
  const project = useProjectStore((s) => s.project);
  const readOnly = useProjectStore((s) => s.readOnly);
  const dispatch = useProjectStore((s) => s.dispatch);

  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const step = project?.steps[stepId];
  if (!step) {
    return null;
  }

  const entries = step.entries;
  const pendingDeleteEntry = entries.find((entry) => entry.id === pendingDeleteId);
  const editingEntry = entries.find((entry) => entry.id === editingEntryId);
  const editingPlugin = editingEntry ? getMethodById(editingEntry.methodId) : undefined;

  const moveEntry = (entryId: string, toIndex: number) => {
    const command = buildReorderCommand(step, stepId, entryId, toIndex);
    if (command) {
      dispatch(command);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const toIndex = entries.findIndex((entry) => entry.id === over.id);
    if (toIndex === -1) return;
    moveEntry(String(active.id), toIndex);
  };

  return (
    <section className="flex flex-col gap-3">
      <h2 className="flex items-baseline gap-2 font-display text-sm font-semibold uppercase tracking-wide text-ink-muted">
        {t("workspace.entriesBand.title")}
        {entries.length > 0 && (
          <span className="font-mono text-2xs normal-case text-ink-muted">
            {t("workspace.entriesBand.entryCount", { count: entries.length })}
          </span>
        )}
      </h2>

      {entries.length === 0 ? (
        <p className="font-body text-sm text-ink-muted">{t("workspace.entriesBand.empty")}</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={entries.map((entry) => entry.id)} strategy={verticalListSortingStrategy}>
            <div className="flex flex-col gap-2">
              {entries.map((entry, index) => (
                <SortableEntryRow key={entry.id} id={entry.id} title={entry.title} disabled={readOnly}>
                  <EntryRow
                    entry={entry}
                    plugin={getMethodById(entry.methodId)}
                    roundOrdinal={entry.roundId ? roundOrdinal(project?.rounds ?? [], entry.roundId) : undefined}
                    readOnly={readOnly}
                    canMoveUp={index > 0}
                    canMoveDown={index < entries.length - 1}
                    onEdit={() => setEditingEntryId(entry.id)}
                    onDuplicate={() =>
                      dispatch(
                        buildDuplicateEntryCommand(step, stepId, entry.id, {
                          now: new Date().toISOString(),
                          newId: crypto.randomUUID(),
                        }),
                      )
                    }
                    onDelete={() => setPendingDeleteId(entry.id)}
                    onSetA3Visibility={(visibility) =>
                      dispatch(buildSetA3VisibilityCommand(step, stepId, entry.id, visibility))
                    }
                    onMoveUp={() => moveEntry(entry.id, index - 1)}
                    onMoveDown={() => moveEntry(entry.id, index + 1)}
                  />
                </SortableEntryRow>
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {editingEntry && editingPlugin && (
        <EntryEditorDialog
          stepId={stepId}
          plugin={editingPlugin}
          mode={{
            kind: "edit",
            entryId: editingEntry.id,
            initialTitle: editingEntry.title,
            initialPayload: editingEntry.payload,
            initialReferences: editingEntry.references,
            initialRoundId: editingEntry.roundId,
            initialImages: editingEntry.images,
          }}
          open
          onOpenChange={(open) => {
            if (!open) setEditingEntryId(null);
          }}
        />
      )}

      <DeleteConfirmDialog
        entry={pendingDeleteEntry}
        onCancel={() => setPendingDeleteId(null)}
        onConfirm={() => {
          if (pendingDeleteEntry) {
            dispatch(buildDeleteEntryCommand(step, stepId, pendingDeleteEntry.id));
          }
          setPendingDeleteId(null);
        }}
      />
    </section>
  );
}

interface DeleteConfirmDialogProps {
  entry: Entry | undefined;
  onCancel: () => void;
  onConfirm: () => void;
}

function DeleteConfirmDialog({ entry, onCancel, onConfirm }: DeleteConfirmDialogProps) {
  const { t } = useTranslation();
  return (
    <DialogRoot
      open={Boolean(entry)}
      onOpenChange={(open) => {
        if (!open) onCancel();
      }}
    >
      {entry && (
        <DialogContent
          title={t("workspace.entriesBand.deleteConfirmTitle")}
          description={t("workspace.entriesBand.deleteConfirmBody", { title: entry.title })}
        >
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onCancel}>
              {t("workspace.entriesBand.deleteCancelAction")}
            </Button>
            <Button variant="primary" onClick={onConfirm}>
              {t("workspace.entriesBand.deleteConfirmAction")}
            </Button>
          </div>
        </DialogContent>
      )}
    </DialogRoot>
  );
}
