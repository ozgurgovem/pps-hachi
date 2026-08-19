import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { OPEN_ITEMS_NEXT_PROBLEM_COLUMNS } from "./columns";
import type { OpenItemsNextProblemPayload } from "./schema";

export function OpenItemsNextProblemEditor({ payload, onChange }: MethodEditorProps<OpenItemsNextProblemPayload>) {
  return (
    <RowTableEditor
      idPrefix="open-items-next-problem"
      columns={OPEN_ITEMS_NEXT_PROBLEM_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
