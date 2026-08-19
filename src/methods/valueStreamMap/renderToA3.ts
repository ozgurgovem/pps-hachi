import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { renderAnnotatedPhotoBlock } from "../shared/annotatedPhoto";
import type { ValueStreamMapPayload } from "./schema";

export function renderValueStreamMapToA3(_payload: ValueStreamMapPayload, entry: A3EntrySummary): A3BlockContent {
  return renderAnnotatedPhotoBlock(entry);
}
