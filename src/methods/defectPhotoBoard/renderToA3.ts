import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { renderAnnotatedPhotoBlock } from "../shared/annotatedPhoto";
import type { DefectPhotoBoardPayload } from "./schema";

export function renderDefectPhotoBoardToA3(_payload: DefectPhotoBoardPayload, entry: A3EntrySummary): A3BlockContent {
  return renderAnnotatedPhotoBlock(entry);
}
