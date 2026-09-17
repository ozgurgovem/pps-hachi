import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import { FIVE_N1K_ANSWER_SOFT_LIMIT } from "./constants";
import type { FiveN1KPayload } from "./schema";

const FIELD_KEYS = [
  "ne",
  "neden",
  "nasil",
  "kim",
  "neZaman",
  "nerede",
] as const satisfies readonly (keyof FiveN1KPayload)[];

/**
 * BVVL round, ADIM 1 (2026-09-17): Barış's own instruction — the diagram's
 * satellite circles are a fixed size, so the Editor shows a live character
 * count against `FIVE_N1K_ANSWER_SOFT_LIMIT` rather than silently letting a
 * long answer overflow. Non-blocking: typing past the limit is still
 * allowed and never truncates the stored value — only the exported
 * diagram's own rendered text truncates, as a last-resort safety net.
 */
export function FiveN1KEditor({ payload, onChange }: MethodEditorProps<FiveN1KPayload>) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELD_KEYS.map((key) => {
        const length = payload[key].length;
        const overLimit = length > FIVE_N1K_ANSWER_SOFT_LIMIT;
        return (
          <div key={key} className="flex flex-col gap-1.5">
            <Label htmlFor={`five-n1k-${key}`}>{t(`methods.fiveN1K.fields.${key}`)}</Label>
            <Textarea
              id={`five-n1k-${key}`}
              value={payload[key]}
              onChange={(event) => onChange({ ...payload, [key]: event.target.value })}
              rows={2}
            />
            <span className={`font-mono text-2xs text-right ${overLimit ? "text-danger" : "text-ink-muted"}`}>
              {t("methods.fiveN1K.charCount", { count: length, limit: FIVE_N1K_ANSWER_SOFT_LIMIT })}
            </span>
          </div>
        );
      })}
    </div>
  );
}
