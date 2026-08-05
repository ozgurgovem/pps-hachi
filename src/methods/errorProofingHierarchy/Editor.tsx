import { useTranslation } from "react-i18next";
import { Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import { ERROR_PROOFING_LEVELS, ERROR_PROOFING_LEVEL_OPTIONS, strengthOf } from "./levels";
import type { ErrorProofingHierarchyPayload } from "./schema";

const LEVEL_COUNT = ERROR_PROOFING_LEVELS.length;

/**
 * SPEC.md §1.3: "Display the strength visually; nudge the user upward."
 * Shape-coded per D-41 (filled vs. empty squares, not a color gradient
 * alone) — strongest (Eliminate) fills every segment, weakest (Procedure/
 * Training) fills only the first.
 */
function StrengthBar({ level }: { level: string }) {
  const strength = strengthOf(level) ?? LEVEL_COUNT;
  return (
    <div className="flex gap-1" role="img" aria-label={`Strength ${LEVEL_COUNT - strength + 1} of ${LEVEL_COUNT}`}>
      {ERROR_PROOFING_LEVELS.map((_, index) => (
        <span
          key={index}
          className={index < LEVEL_COUNT - strength + 1 ? "h-2 w-4 bg-accent" : "h-2 w-4 border border-border"}
        />
      ))}
    </div>
  );
}

export function ErrorProofingHierarchyEditor({ payload, onChange }: MethodEditorProps<ErrorProofingHierarchyPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="error-proofing-level">{t("methods.errorProofingHierarchy.levelLabel")}</Label>
        <SelectRoot
          value={payload.level}
          onValueChange={(next) => onChange({ ...payload, level: next as ErrorProofingHierarchyPayload["level"] })}
        >
          <SelectTrigger id="error-proofing-level">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ERROR_PROOFING_LEVEL_OPTIONS.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {t(option.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </SelectRoot>
        <StrengthBar level={payload.level} />
      </div>

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="error-proofing-note">{t("methods.errorProofingHierarchy.noteLabel")}</Label>
        <Textarea
          id="error-proofing-note"
          rows={2}
          value={payload.note}
          onChange={(event) => onChange({ ...payload, note: event.target.value })}
        />
      </div>
    </div>
  );
}
