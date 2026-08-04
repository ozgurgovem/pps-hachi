import { useTranslation } from "react-i18next";
import { Input, Label } from "../../ui";
import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { COMPARATIVE_ANALYSIS_COLUMNS } from "./columns";
import type { ComparativeAnalysisPayload } from "./schema";

export function ComparativeAnalysisEditor({ payload, onChange }: MethodEditorProps<ComparativeAnalysisPayload>) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="comparative-analysis-subject">{t("methods.comparativeAnalysis.subjectLabel")}</Label>
        <Input
          id="comparative-analysis-subject"
          value={payload.subject}
          placeholder={t("methods.comparativeAnalysis.subjectPlaceholder")}
          onChange={(event) => onChange({ ...payload, subject: event.target.value })}
        />
      </div>
      <RowTableEditor
        idPrefix="comparative-analysis"
        columns={COMPARATIVE_ANALYSIS_COLUMNS}
        rows={payload.rows}
        onChange={(rows) => onChange({ ...payload, rows })}
      />
    </div>
  );
}
