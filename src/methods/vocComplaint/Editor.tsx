import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { VOC_COMPLAINT_COLUMNS } from "./columns";
import type { VocComplaintPayload } from "./schema";

export function VocComplaintEditor({ payload, onChange }: MethodEditorProps<VocComplaintPayload>) {
  return (
    <RowTableEditor
      idPrefix="voc-complaint"
      columns={VOC_COMPLAINT_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
