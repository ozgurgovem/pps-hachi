import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { POINT_OF_CAUSE_FIELDS } from "./fields";
import type { PointOfCausePayload } from "./schema";

export function renderPointOfCauseToA3(payload: PointOfCausePayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, POINT_OF_CAUSE_FIELDS)],
  };
}
