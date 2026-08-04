import { emptyFieldFormValues } from "../shared/fieldForm";
import type { MethodPlugin } from "../types";
import { PfmeaLinkageEditor } from "./Editor";
import { PFMEA_LINKAGE_FIELDS } from "./fields";
import { renderPfmeaLinkageToA3 } from "./renderToA3";
import { PfmeaLinkagePayloadSchema, type PfmeaLinkagePayload } from "./schema";

export const PFMEA_LINKAGE_METHOD_ID = "pfmea-linkage";

/**
 * Holds no `referenceRoles` on purpose — see `schema.ts`. The PFMEA is an
 * external controlled document (`meta.linkedRecords[]`, SPEC.md §4.2), not
 * an entry, so D-116's entry-to-entry mechanism does not apply to it.
 */
export const pfmeaLinkageMethod: MethodPlugin<PfmeaLinkagePayload> = {
  id: PFMEA_LINKAGE_METHOD_ID,
  steps: [4],
  nameKey: "methods.pfmeaLinkage.name",
  useWhenKey: "methods.pfmeaLinkage.useWhen",
  schema: PfmeaLinkagePayloadSchema,
  Editor: PfmeaLinkageEditor,
  createEmptyPayload: () => emptyFieldFormValues(PFMEA_LINKAGE_FIELDS),
  renderToA3: renderPfmeaLinkageToA3,
};
