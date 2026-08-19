import { useTranslation } from "react-i18next";
import type { A3Visibility, Entry } from "../../../domain/model";
import type { ErasedMethodPlugin } from "../../../methods";
import {
  Badge,
  Button,
  Label,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  cn,
} from "../../../ui";

export interface EntryRowProps {
  entry: Entry;
  /** `undefined` when this build doesn't recognize `entry.methodId` — P-05's UI half. */
  plugin: ErasedMethodPlugin | undefined;
  /** D-149(6d): the entry's round ordinal ("Tur N"), precomputed by the caller — `undefined` when untagged. */
  roundOrdinal?: number | undefined;
  readOnly: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onSetA3Visibility: (visibility: A3Visibility) => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

/**
 * P-05 (closed structurally by D-52; this is the UI half, moved to Phase 3):
 * an entry whose `methodId` this build doesn't recognize renders as a
 * read-only placeholder — reorder / visibility / delete still work (they
 * never touch `payload`), but it can't be opened or duplicated, since this
 * build has no schema or Editor to interpret its `payload` with.
 */
export function EntryRow({
  entry,
  plugin,
  roundOrdinal,
  readOnly,
  canMoveUp,
  canMoveDown,
  onEdit,
  onDuplicate,
  onDelete,
  onSetA3Visibility,
  onMoveUp,
  onMoveDown,
}: EntryRowProps) {
  const { t } = useTranslation();
  const isUnknown = !plugin;

  return (
    <div
      className={cn(
        "flex flex-col gap-2 rounded-control border bg-surface p-3",
        isUnknown ? "border-dashed border-border" : "border-border",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <span className="font-body text-sm font-medium text-ink">{entry.title || "—"}</span>
          <div className="flex items-center gap-1.5">
            {isUnknown ? (
              <Badge status="flagged">{t("workspace.unknownMethod.badge")}</Badge>
            ) : (
              <span className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
                {t(plugin.nameKey)}
              </span>
            )}
            {roundOrdinal !== undefined && <Badge>{t("workspace.rounds.badge", { n: roundOrdinal })}</Badge>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            disabled={readOnly || !canMoveUp}
            aria-label={t("workspace.entriesBand.moveUp")}
          >
            ↑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            disabled={readOnly || !canMoveDown}
            aria-label={t("workspace.entriesBand.moveDown")}
          >
            ↓
          </Button>
          {!isUnknown && (
            <>
              <Button variant="ghost" size="sm" onClick={onEdit} disabled={readOnly}>
                {t("workspace.entriesBand.edit")}
              </Button>
              <Button variant="ghost" size="sm" onClick={onDuplicate} disabled={readOnly}>
                {t("workspace.entriesBand.duplicate")}
              </Button>
            </>
          )}
          <Button variant="ghost" size="sm" onClick={onDelete} disabled={readOnly}>
            {t("workspace.entriesBand.delete")}
          </Button>
        </div>
      </div>

      {isUnknown && (
        <p className="font-body text-xs text-ink-muted">
          {t("workspace.unknownMethod.body", { methodId: entry.methodId })}
        </p>
      )}

      <A3VisibilitySelect value={entry.a3Visibility} disabled={readOnly} onChange={onSetA3Visibility} />
    </div>
  );
}

interface A3VisibilitySelectProps {
  value: A3Visibility;
  disabled: boolean;
  onChange: (visibility: A3Visibility) => void;
}

function A3VisibilitySelect({ value, disabled, onChange }: A3VisibilitySelectProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-2">
      <Label className="font-mono text-2xs uppercase tracking-wide text-ink-muted">
        {t("workspace.entriesBand.a3Visibility.label")}
      </Label>
      <SelectRoot value={value} onValueChange={(next) => onChange(next as A3Visibility)} disabled={disabled}>
        <SelectTrigger className="h-7 w-32 text-xs">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="primary">{t("workspace.entriesBand.a3Visibility.primary")}</SelectItem>
          <SelectItem value="appendix">{t("workspace.entriesBand.a3Visibility.appendix")}</SelectItem>
          <SelectItem value="hidden">{t("workspace.entriesBand.a3Visibility.hidden")}</SelectItem>
        </SelectContent>
      </SelectRoot>
    </div>
  );
}
