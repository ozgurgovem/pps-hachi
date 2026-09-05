import { parsePromptFile, type PromptFile } from "./frontMatter";

/**
 * SPEC.md §8.7: `src/ai/prompts/{step}/{methodId}.{version}.md` — the same
 * "content lives in a file, not a string literal in a component" convention
 * `coachContent.ts` already established for `src/content/coaching/` (Faz 3).
 * `eager: true` bundles every prompt file at build time; there are only a
 * handful today and no runtime fetch to fail.
 *
 * Faz 10/K1/§2.1: scoped to single-digit step directories (`1`..`8`) rather
 * than every directory (`./*\/*.md`) — `src/ai/prompts/whole-project/` holds
 * a parallel, differently-shaped front-matter (`purpose` instead of
 * `step`/`methodId`, see `wholeProjectLibrary.ts`) that `parsePromptFile`
 * cannot read, and this glob must never pick those files up.
 */
const modules = import.meta.glob<string>("./[0-9]/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const files: readonly PromptFile[] = Object.values(modules).map(parsePromptFile);

/**
 * `promptVersion` is `"{methodId}.{version}"` (e.g. `"pareto.v1"`) — a real
 * file name/version string, matching D-201's own `Provenance.model.
 * promptVersion` requirement and replacing its `"bare-chat-v1"` placeholder
 * for whichever method actually declares `aiProposal`.
 */
export function getPromptFile(step: number, methodId: string, version: string): PromptFile | undefined {
  return files.find(
    (file) =>
      file.frontMatter.step === step &&
      file.frontMatter.methodId === methodId &&
      file.frontMatter.version === version,
  );
}
