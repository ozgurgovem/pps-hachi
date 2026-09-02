import type { MethodPlugin } from "../types";
import { TpmLossTaxonomyEditor } from "./Editor";
import { renderTpmLossTaxonomyToA3 } from "./renderToA3";
import { TpmLossTaxonomyPayloadSchema, type TpmLossTaxonomyPayload, type TpmLossTag } from "./schema";

export const TPM_LOSS_TAXONOMY_METHOD_ID = "tpm-loss-taxonomy";

function emptyTag(): TpmLossTag {
  return { applies: false, severity: "low" };
}

export const tpmLossTaxonomyMethod: MethodPlugin<TpmLossTaxonomyPayload> = {
  id: TPM_LOSS_TAXONOMY_METHOD_ID,
  steps: [1],
  nameKey: "methods.tpmLossTaxonomy.name",
  useWhenKey: "methods.tpmLossTaxonomy.useWhen",
  schema: TpmLossTaxonomyPayloadSchema,
  Editor: TpmLossTaxonomyEditor,
  createEmptyPayload: () => ({
    workSafety: emptyTag(),
    cost: emptyTag(),
    productivity: emptyTag(),
    quality: emptyTag(),
    maintenance: emptyTag(),
    humanResources: emptyTag(),
    environment: emptyTag(),
  }),
  renderToA3: renderTpmLossTaxonomyToA3,
  aiProposal: { promptVersion: "v1" },
};
