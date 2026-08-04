import { RowTableEditor } from "../shared/RowTableEditor";
import type { MethodEditorProps } from "../types";
import { CATEGORY_BREAKDOWN_COLUMNS } from "./columns";
import type { CategoryBreakdownPayload } from "./schema";

export function CategoryBreakdownEditor({ payload, onChange }: MethodEditorProps<CategoryBreakdownPayload>) {
  return (
    <RowTableEditor
      idPrefix="category-breakdown"
      columns={CATEGORY_BREAKDOWN_COLUMNS}
      rows={payload.rows}
      onChange={(rows) => onChange({ ...payload, rows })}
    />
  );
}
