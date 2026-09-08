import { useId } from "react";
import { useTranslation } from "react-i18next";
import type { Round } from "../../../domain/model";
import { roundOrdinal } from "../../../domain/selectors";
import { Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue } from "../../../ui";

const UNTAGGED = "__none__";

interface EntryRoundFieldProps {
  rounds: readonly Round[];
  /** `undefined` when the entry carries no round tag. */
  value: string | undefined;
  /** `null` clears the tag. */
  onChange: (roundId: string | null) => void;
}

/**
 * D-149(6d): opt-in tagging, not a required field — most entries never
 * belong to a round. Rendered by `EntryEditorPanel` only when at least one
 * round exists (an empty list would offer nothing but a confusing "no
 * round" option on every entry in the project).
 */
export function EntryRoundField({ rounds, value, onChange }: EntryRoundFieldProps) {
  const { t } = useTranslation();
  const fieldId = useId();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={fieldId}>{t("workspace.rounds.fieldLabel")}</Label>
      <SelectRoot
        value={value ?? UNTAGGED}
        onValueChange={(next) => onChange(next === UNTAGGED ? null : next)}
      >
        <SelectTrigger id={fieldId} className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={UNTAGGED}>{t("workspace.rounds.none")}</SelectItem>
          {rounds.map((round) => (
            <SelectItem key={round.id} value={round.id}>
              {t("workspace.rounds.ordinal", { n: roundOrdinal(rounds, round.id) })} — {round.reason}
            </SelectItem>
          ))}
        </SelectContent>
      </SelectRoot>
    </div>
  );
}
