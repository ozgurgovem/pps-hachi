import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { TRIAL_RESULT_LOG_COLUMNS } from "./columns";
import type { TrialResultLogPayload } from "./schema";

export function TrialResultLogEditor({ payload, onChange }: MethodEditorProps<TrialResultLogPayload>) {
  return (
    <RowTableEditor
      idPrefix="trial-result-log"
      columns={TRIAL_RESULT_LOG_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
