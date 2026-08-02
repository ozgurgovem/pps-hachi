import { useTranslation } from "react-i18next";
import { Label, Textarea } from "../../ui";
import type { MethodEditorProps } from "../types";
import type { GenericTextPayload } from "./schema";

export function GenericTextEditor({ payload, onChange }: MethodEditorProps<GenericTextPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor="generic-text-editor">{t("methods.genericText.fieldLabel")}</Label>
      <Textarea
        id="generic-text-editor"
        value={payload.text}
        onChange={(event) => onChange({ ...payload, text: event.target.value })}
        rows={6}
      />
    </div>
  );
}
