import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { IMPLEMENTATION_ISSUES_LOG_COLUMNS } from "./columns";
import type { ImplementationIssuesLogPayload } from "./schema";

export function ImplementationIssuesLogEditor({ payload, onChange }: MethodEditorProps<ImplementationIssuesLogPayload>) {
  return (
    <RowTableEditor
      idPrefix="implementation-issues-log"
      columns={IMPLEMENTATION_ISSUES_LOG_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
