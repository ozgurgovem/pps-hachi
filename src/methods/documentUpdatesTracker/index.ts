import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { DocumentUpdatesTrackerEditor } from "./Editor";
import { DOCUMENT_TYPES } from "./documentTypes";
import { DOCUMENT_UPDATE_FIELDS } from "./fields";
import { renderDocumentUpdatesTrackerToA3 } from "./renderToA3";
import { DocumentUpdatesTrackerPayloadSchema, type DocumentUpdatesTrackerPayload } from "./schema";

export const DOCUMENT_UPDATES_TRACKER_METHOD_ID = "document-updates-tracker";

export const documentUpdatesTrackerMethod: MethodPlugin<DocumentUpdatesTrackerPayload> = {
  id: DOCUMENT_UPDATES_TRACKER_METHOD_ID,
  steps: [8],
  nameKey: "methods.documentUpdatesTracker.name",
  useWhenKey: "methods.documentUpdatesTracker.useWhen",
  schema: DocumentUpdatesTrackerPayloadSchema,
  Editor: DocumentUpdatesTrackerEditor,
  createEmptyPayload: () =>
    Object.fromEntries(
      DOCUMENT_TYPES.map((documentType) => [documentType, emptyFieldFormValues(DOCUMENT_UPDATE_FIELDS)]),
    ) as DocumentUpdatesTrackerPayload,
  renderToA3: renderDocumentUpdatesTrackerToA3,
};
