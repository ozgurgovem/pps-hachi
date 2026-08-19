import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { renderAnnotatedPhotoBlock } from "../shared/annotatedPhoto";
import type { SpaghettiDiagramPayload } from "./schema";

export function renderSpaghettiDiagramToA3(_payload: SpaghettiDiagramPayload, entry: A3EntrySummary): A3BlockContent {
  return renderAnnotatedPhotoBlock(entry);
}
