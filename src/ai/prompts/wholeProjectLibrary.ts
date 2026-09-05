import { parseWholeProjectPromptFile, type WholeProjectPromptFile } from "./frontMatter";

/**
 * Faz 10/K1/§2.1: the whole-project counterpart of `library.ts` —
 * `src/ai/prompts/whole-project/{purpose}.{version}.md`. `getPromptFile`'s
 * `{step, methodId}` key doesn't fit a prompt that looks at the entire
 * `ProjectModel` at once (the A3 layout reviewer, and K2/K3's future
 * mock-auditor/translation prompts), so this is a parallel, separately
 * globbed and separately parsed library rather than an extension of
 * `library.ts` itself — the two front-matter shapes are genuinely different
 * (`purpose` vs. `step`/`methodId`), and mixing them into one glob would
 * make every whole-project file fail `parsePromptFile`'s required-field
 * checks (see `library.ts`'s own glob, tightened to avoid this directory).
 */
const modules = import.meta.glob<string>("./whole-project/*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

const files: readonly WholeProjectPromptFile[] = Object.values(modules).map(parseWholeProjectPromptFile);

export function getWholeProjectPromptFile(purpose: string, version: string): WholeProjectPromptFile | undefined {
  return files.find((file) => file.frontMatter.purpose === purpose && file.frontMatter.version === version);
}
