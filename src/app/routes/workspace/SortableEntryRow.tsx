import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "../../../ui";

interface SortableEntryRowProps {
  id: string;
  title: string;
  disabled: boolean;
  children: ReactNode;
}

/**
 * Drag is the SPEC.md §2.2 mechanism ("reorderable by drag"); the ↑/↓
 * buttons in `EntryRow` are the guaranteed-accessible, always-available
 * equivalent (dnd-kit's own keyboard sensor also works via this handle,
 * `tabIndex`/`role="button"` come from `attributes`). Both dispatch the same
 * `entries.reorder` command, so they can never disagree.
 */
export function SortableEntryRow({ id, title, disabled, children }: SortableEntryRowProps) {
  const { t } = useTranslation();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
    disabled,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-start gap-2", isDragging && "opacity-60")}
    >
      {!disabled && (
        <button
          type="button"
          aria-label={t("workspace.entriesBand.dragHandleLabel", { title })}
          className="mt-3 cursor-grab touch-none text-ink-muted hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          {...attributes}
          {...listeners}
        >
          <DragHandleIcon />
        </button>
      )}
      <div className="flex-1">{children}</div>
    </div>
  );
}

function DragHandleIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
      <circle cx="2" cy="2" r="1.5" />
      <circle cx="8" cy="2" r="1.5" />
      <circle cx="2" cy="8" r="1.5" />
      <circle cx="8" cy="8" r="1.5" />
      <circle cx="2" cy="14" r="1.5" />
      <circle cx="8" cy="14" r="1.5" />
    </svg>
  );
}
