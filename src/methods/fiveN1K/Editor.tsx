import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { FiveN1KPayload } from "./schema";

const FIELD_KEYS = [
  "ne",
  "neden",
  "nasil",
  "kim",
  "neZaman",
  "nerede",
] as const satisfies readonly (keyof FiveN1KPayload)[];

export function FiveN1KEditor({ payload, onChange }: MethodEditorProps<FiveN1KPayload>) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELD_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`five-n1k-${key}`}>{t(`methods.fiveN1K.fields.${key}`)}</Label>
          <Textarea
            id={`five-n1k-${key}`}
            value={payload[key]}
            onChange={(event) => onChange({ ...payload, [key]: event.target.value })}
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
