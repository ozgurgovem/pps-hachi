import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { FiveG5N1KPayload } from "./schema";

const FIELD_KEYS = [
  "gemba",
  "gembutsu",
  "genjitsu",
  "genri",
  "gensoku",
  "ne",
  "nerede",
  "nasil",
  "neZaman",
  "neKadar",
  "kim",
] as const satisfies readonly (keyof FiveG5N1KPayload)[];

export function FiveG5N1KEditor({ payload, onChange }: MethodEditorProps<FiveG5N1KPayload>) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELD_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`5g5n1k-${key}`}>{t(`methods.fiveG5N1K.fields.${key}`)}</Label>
          <Textarea
            id={`5g5n1k-${key}`}
            value={payload[key]}
            onChange={(event) => onChange({ ...payload, [key]: event.target.value })}
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
