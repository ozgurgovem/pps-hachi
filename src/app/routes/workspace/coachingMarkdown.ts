export type CoachingBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "list"; items: string[] };

/**
 * A deliberately tiny subset of markdown — `#`/`##` headings, blank-line-
 * separated paragraphs, `- ` list items — parsed into structured blocks
 * rather than HTML, so `CoachBand` renders them as plain React text nodes.
 * No `dangerouslySetInnerHTML` anywhere: coaching content is data (D-23,
 * `src/content/coaching/`), but it still never becomes markup.
 */
export function parseCoachingMarkdown(markdown: string): CoachingBlock[] {
  const blocks: CoachingBlock[] = [];
  let paragraphLines: string[] = [];
  let listItems: string[] = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      blocks.push({ type: "paragraph", text: paragraphLines.join(" ").trim() });
      paragraphLines = [];
    }
  }

  function flushList() {
    if (listItems.length > 0) {
      blocks.push({ type: "list", items: listItems });
      listItems = [];
    }
  }

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();

    if (line === "") {
      flushParagraph();
      flushList();
      continue;
    }
    if (line.startsWith("#")) {
      flushParagraph();
      flushList();
      blocks.push({ type: "heading", text: line.replace(/^#+\s*/, "") });
      continue;
    }
    if (line.startsWith("- ")) {
      flushParagraph();
      listItems.push(line.slice(2).trim());
      continue;
    }
    flushList();
    paragraphLines.push(line);
  }

  flushParagraph();
  flushList();
  return blocks;
}
