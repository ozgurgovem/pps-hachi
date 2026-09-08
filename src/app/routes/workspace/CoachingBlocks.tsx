import type { CoachingBlock } from "./coachingMarkdown";

interface CoachingBlocksProps {
  blocks: readonly CoachingBlock[];
}

/**
 * Extracted before a third repetition (D-127's own discipline): `CoachBand`
 * had this heading/list/paragraph rendering inline; W2's `AssistantGuideCard`
 * needs the exact same rendering of the exact same coaching content, so the
 * JSX moved here rather than being copy-pasted a second time.
 */
export function CoachingBlocks({ blocks }: CoachingBlocksProps) {
  return (
    <>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          return (
            <h3 key={index} className="font-display text-xs font-semibold uppercase tracking-wide text-ink">
              {block.text}
            </h3>
          );
        }
        if (block.type === "list") {
          return (
            <ul key={index} className="list-disc pl-5 font-body text-sm text-ink-muted">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex}>{item}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={index} className="font-body text-sm text-ink-muted">
            {block.text}
          </p>
        );
      })}
    </>
  );
}
