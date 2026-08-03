import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { FiveW2HPayload } from "./schema";

const FIELD_KEYS = [
  "what",
  "where",
  "when",
  "who",
  "which",
  "how",
  "howMuch",
] as const satisfies readonly (keyof FiveW2HPayload)[];

export function FiveW2HEditor({ payload, onChange }: MethodEditorProps<FiveW2HPayload>) {
  const { t } = useTranslation();

  return (
    <div className="grid grid-cols-2 gap-3">
      {FIELD_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`5w2h-${key}`}>{t(`methods.fiveW2H.fields.${key}`)}</Label>
          <Textarea
            id={`5w2h-${key}`}
            value={payload[key]}
            onChange={(event) => onChange({ ...payload, [key]: event.target.value })}
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
