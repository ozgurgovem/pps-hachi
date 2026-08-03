import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { CHECK_SHEET_COLUMNS } from "./columns";
import type { CheckSheetPayload } from "./schema";

export function CheckSheetEditor({ payload, onChange }: MethodEditorProps<CheckSheetPayload>) {
  return (
    <RowTableEditor
      idPrefix="check-sheet"
      columns={CHECK_SHEET_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
