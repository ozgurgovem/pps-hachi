import type { StepId } from "../../../domain/model";

/**
 * D-23: coaching content is data, not JSX — `src/content/coaching/{tr,en}/
 * step-N.md`. `eager: true` bundles all 16 files at build time (they're a
 * few KB total); there's no runtime fetch to fail.
 */
const modules = import.meta.glob<string>("../../../content/coaching/*/step-*.md", {
  eager: true,
  query: "?raw",
  import: "default",
});

export function getCoachingMarkdown(language: "tr" | "en", stepId: StepId): string {
  const suffix = `/${language}/step-${stepId}.md`;
  const key = Object.keys(modules).find((path) => path.endsWith(suffix));
  return key ? (modules[key] ?? "") : "";
}
