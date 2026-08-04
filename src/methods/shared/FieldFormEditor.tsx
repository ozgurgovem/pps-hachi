import { useTranslation } from "react-i18next";
import {
  Input,
  Label,
  SelectContent,
  SelectItem,
  SelectRoot,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "../../ui";
import type { FieldFormField, FieldFormValues } from "./fieldForm";

interface FieldFormEditorProps<TKey extends string> {
  readonly idPrefix: string;
  readonly fields: readonly FieldFormField<TKey>[];
  readonly values: FieldFormValues<TKey>;
  readonly onChange: (values: FieldFormValues<TKey>) => void;
}

/**
 * Shared editor for the `fieldForm.ts` substrate — `RowTableEditor`'s
 * single-record sibling, same four field kinds, same label/id discipline.
 */
export function FieldFormEditor<TKey extends string>({
  idPrefix,
  fields,
  values,
  onChange,
}: FieldFormEditorProps<TKey>) {
  const { t } = useTranslation();

  function update(key: TKey, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <div className="grid grid-cols-2 gap-3">
      {fields.map((field) => {
        const fieldId = `${idPrefix}-${field.key}`;
        const value = values[field.key] ?? "";
        return (
          <div
            key={field.key}
            className={field.wide === true ? "col-span-2 flex flex-col gap-1.5" : "flex flex-col gap-1.5"}
          >
            <Label htmlFor={fieldId}>{t(field.labelKey)}</Label>
            {field.type === "textarea" && (
              <Textarea id={fieldId} value={value} rows={2} onChange={(e) => update(field.key, e.target.value)} />
            )}
            {field.type === "date" && (
              <Input id={fieldId} type="date" value={value} onChange={(e) => update(field.key, e.target.value)} />
            )}
            {field.type === "select" && field.options && (
              <SelectRoot value={value} onValueChange={(next) => update(field.key, next)}>
                <SelectTrigger id={fieldId}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {t(option.labelKey)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </SelectRoot>
            )}
            {field.type === "text" && (
              <Input id={fieldId} value={value} onChange={(e) => update(field.key, e.target.value)} />
            )}
          </div>
        );
      })}
    </div>
  );
}
