import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { SUSTAINMENT_AUDIT_COLUMNS } from "./columns";
import type { SustainmentAuditPayload } from "./schema";

export function SustainmentAuditEditor({ payload, onChange }: MethodEditorProps<SustainmentAuditPayload>) {
  return (
    <RowTableEditor
      idPrefix="sustainment-audit"
      columns={SUSTAINMENT_AUDIT_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
