import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { fieldFormLines } from "../shared/fieldForm";
import { ACTION_ITEM_FIELDS } from "./fields";
import type { ActionItemPayload } from "./schema";

export function renderActionItemToA3(payload: ActionItemPayload, entry: A3EntrySummary): A3BlockContent {
  return {
    lines: [{ text: entry.title, bold: true }, ...fieldFormLines(payload, ACTION_ITEM_FIELDS)],
  };
}
