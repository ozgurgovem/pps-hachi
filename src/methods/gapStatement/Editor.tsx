import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { GapStatementPayload } from "./schema";

const FIELD_KEYS = ["ideal", "actual", "gap"] as const satisfies readonly (keyof GapStatementPayload)[];

export function GapStatementEditor({ payload, onChange }: MethodEditorProps<GapStatementPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-3">
      {FIELD_KEYS.map((key) => (
        <div key={key} className="flex flex-col gap-1.5">
          <Label htmlFor={`gap-statement-${key}`}>{t(`methods.gapStatement.${key}Label`)}</Label>
          <Textarea
            id={`gap-statement-${key}`}
            value={payload[key]}
            onChange={(event) => onChange({ ...payload, [key]: event.target.value })}
            rows={2}
          />
        </div>
      ))}
    </div>
  );
}
