import { useTranslation } from "react-i18next";
import { FieldFormEditor } from "../shared/FieldFormEditor";
import type { MethodEditorProps } from "../types";
import { DOCUMENT_TYPES, documentTypeLabelKey, type DocumentType } from "./documentTypes";
import { DOCUMENT_UPDATE_FIELDS, type DocumentUpdateFieldKey } from "./fields";
import type { DocumentUpdatesTrackerPayload } from "./schema";

export function DocumentUpdatesTrackerEditor({
  payload,
  onChange,
}: MethodEditorProps<DocumentUpdatesTrackerPayload>) {
  const { t } = useTranslation();

  function updateRow(documentType: DocumentType, values: DocumentUpdatesTrackerPayload[DocumentType]) {
    onChange({ ...payload, [documentType]: values });
  }

  return (
    <div className="flex flex-col gap-4">
      {DOCUMENT_TYPES.map((documentType) => (
        <div key={documentType} className="flex flex-col gap-2 rounded-control border border-border p-3">
          <span className="font-body text-xs font-medium text-ink-muted">{t(documentTypeLabelKey(documentType))}</span>
          <FieldFormEditor<DocumentUpdateFieldKey>
            idPrefix={`document-updates-${documentType}`}
            fields={DOCUMENT_UPDATE_FIELDS}
            values={payload[documentType]}
            onChange={(values) => updateRow(documentType, values)}
          />
        </div>
      ))}
    </div>
  );
}
