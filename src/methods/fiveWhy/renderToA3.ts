import type { A3BlockContent, A3EntrySummary } from "../../a3/methodContract";
import { whyChainLines } from "../shared/whyChain";
import type { FiveWhyPayload } from "./schema";

export function renderFiveWhyToA3(payload: FiveWhyPayload, entry: A3EntrySummary): A3BlockContent {
  const problemLine = payload.problemStatement.trim().length > 0 ? [{ text: payload.problemStatement }] : [];

  return {
    lines: [{ text: entry.title, bold: true }, ...problemLine, ...whyChainLines(payload.whys)],
  };
}
