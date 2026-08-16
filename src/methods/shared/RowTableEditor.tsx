import { useTranslation } from "react-i18next";
import { Button, Input, Label, SelectContent, SelectItem, SelectRoot, SelectTrigger, SelectValue, Textarea } from "../../ui";
import { newRowTableRow, type RowTableColumn, type RowTableRow } from "./rowTable";

interface RowTableEditorProps<TKey extends string> {
  readonly idPrefix: string;
  readonly columns: readonly RowTableColumn<TKey>[];
  /** Mutable, matching the Zod-inferred row-array field this always round-trips into. */
  readonly rows: RowTableRow<TKey>[];
  readonly onChange: (rows: RowTableRow<TKey>[]) => void;
}

/**
 * D-115: shared by every "row list" method (VOC/complaint, containment/ICA,
 * stratification matrix, check sheet, SIPOC, …) — see `rowTable.ts`. Mirrors
 * `WhyChainEditor`'s add/update/remove shape, generalized over caller-owned
 * columns instead of one fixed `answer` field.
 */
export function RowTableEditor<TKey extends string>({ idPrefix, columns, rows, onChange }: RowTableEditorProps<TKey>) {
  const { t } = useTranslation();

  function updateField(rowId: string, key: TKey, value: string) {
    onChange(rows.map((row) => (row.id === rowId ? { ...row, [key]: value } : row)));
  }

  function addRow() {
    onChange([...rows, newRowTableRow(columns)]);
  }

  function removeRow(rowId: string) {
    onChange(rows.filter((row) => row.id !== rowId));
  }

  return (
    <div className="flex flex-col gap-3">
      {rows.map((row) => (
        <div key={row.id} className="flex flex-col gap-2 rounded-control border border-border p-3">
          <div className="grid grid-cols-2 gap-3">
            {columns.map((column) => {
              const fieldId = `${idPrefix}-${row.id}-${column.key}`;
              // `?? ""` guards a row persisted before this column existed —
              // an older `.ppsx` must still open (CLAUDE.md), and a method
              // adding a column to an already-shipped row schema is exactly
              // that case; `row[column.key]` is `undefined` for such rows,
              // not the empty string `newRowTableRow` would have given it.
              const value = row[column.key] ?? "";
              return (
                <div key={column.key} className="flex flex-col gap-1.5">
                  <Label htmlFor={fieldId}>{t(column.labelKey)}</Label>
                  {column.type === "textarea" && (
                    <Textarea id={fieldId} value={value} onChange={(e) => updateField(row.id, column.key, e.target.value)} rows={2} />
                  )}
                  {column.type === "date" && (
                    <Input
                      id={fieldId}
                      type="date"
                      value={value}
                      onChange={(e) => updateField(row.id, column.key, e.target.value)}
                    />
                  )}
                  {column.type === "select" && column.options && (
                    <SelectRoot value={value} onValueChange={(next) => updateField(row.id, column.key, next)}>
                      <SelectTrigger id={fieldId}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {column.options.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {t(option.labelKey)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  )}
                  {column.type === "text" && (
                    <Input id={fieldId} value={value} onChange={(e) => updateField(row.id, column.key, e.target.value)} />
                  )}
                </div>
              );
            })}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => removeRow(row.id)}
            aria-label={t("methods.rowTable.removeRow")}
            className="self-end"
          >
            ✕
          </Button>
        </div>
      ))}
      <Button type="button" variant="secondary" size="sm" onClick={addRow}>
        {t("methods.rowTable.addRow")}
      </Button>
    </div>
  );
}
