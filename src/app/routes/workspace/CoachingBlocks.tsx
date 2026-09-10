import type { CoachingBlock } from "./coachingMarkdown";

interface CoachingBlocksProps {
  blocks: readonly CoachingBlock[];
}

/**
 * Extracted out of `CoachBand`'s own inline heading/list/paragraph rendering
 * during W2 (D-217/D-228), when the step's AI column briefly rendered this
 * same coaching content a second time (`AssistantGuideCard`). D-244 removed
 * that duplicate — `CoachBand` is the one caller again — but the extraction
 * stays: it is still the one place this rendering logic lives.
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
