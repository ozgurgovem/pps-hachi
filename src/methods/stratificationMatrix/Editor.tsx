import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { STRATIFICATION_MATRIX_COLUMNS } from "./columns";
import type { StratificationMatrixPayload } from "./schema";

export function StratificationMatrixEditor({ payload, onChange }: MethodEditorProps<StratificationMatrixPayload>) {
  return (
    <RowTableEditor
      idPrefix="stratification-matrix"
      columns={STRATIFICATION_MATRIX_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
