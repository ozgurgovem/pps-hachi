/**
 * SPEC.md §8.7: "Each prompt file declares its mode, its required context
 * slices, and its output schema reference in front-matter." A deliberately
 * tiny hand-rolled parser — `--- key: value ---` blocks only, `[a, b]` for
 * array values — mirroring `coachingMarkdown.ts`'s own precedent (Faz 3) of
 * hand-rolling a small format subset rather than pulling in a YAML library
 * for a handful of scalar fields.
 */
export interface PromptFrontMatter {
  /** J1 only ever writes `"draft"` — SPEC.md §8.6's other three modes are Faz 9+ scope beyond this dilim (§3). */
  readonly mode: string;
  readonly methodId: string;
  readonly step: number;
  readonly version: string;
  /** Which method's Zod schema this prompt's output validates against — usually `methodId` itself, kept separate so a future prompt can target a shape other than its own method's (an extraction prompt, say). */
  readonly outputSchema: string;
  /**
   * SPEC.md §8.7's own front-matter contract names this, but J1 gathers no
   * automatic project context (§2.4: manual entry only) — declared here for
   * documentation and forward-compatibility, not yet consumed by anything.
   */
  readonly contextSlices: readonly string[];
}

export interface PromptFile {
  readonly frontMatter: PromptFrontMatter;
  readonly body: string;
}

/**
 * Faz 10/K1/§2.1: the whole-project counterpart of `PromptFrontMatter` — a
 * prompt like the A3 layout reviewer looks at the entire `ProjectModel`, not
 * one method's payload, so it has no `step`/`methodId` to key off. `purpose`
 * replaces that pair (e.g. `"layout-review"`); everything else is the same
 * shape, deliberately — K2/K3's own whole-project prompts (mock-auditor
 * review, TR↔EN translation) are expected to reuse this same front-matter
 * contract rather than inventing a third variant.
 */
export interface WholeProjectPromptFrontMatter {
  readonly mode: string;
  readonly purpose: string;
  readonly version: string;
  readonly outputSchema: string;
  readonly contextSlices: readonly string[];
}

export interface WholeProjectPromptFile {
  readonly frontMatter: WholeProjectPromptFrontMatter;
  readonly body: string;
}

function parseValue(raw: string): string | readonly string[] {
  const trimmed = raw.trim();
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    const inner = trimmed.slice(1, -1).trim();
    if (inner.length === 0) {
      return [];
    }
    return inner.split(",").map((item) => item.trim());
  }
  return trimmed;
}

type FrontMatterFields = ReadonlyMap<string, string | readonly string[]>;

interface ParsedFrontMatterBlock {
  readonly fields: FrontMatterFields;
  readonly body: string;
}

/**
 * The shared half of both parsers below: split off the `--- ... ---` block,
 * parse its `key: value` lines, and trim the body. Throws on malformed
 * front-matter (missing delimiters) — every prompt file is a build-time
 * asset checked into the repo, not user input, so a loud failure beats a
 * silently wrong prompt reaching a real Vorion request.
 */
function parseFrontMatterBlock(raw: string): ParsedFrontMatterBlock {
  const lines = raw.split("\n");
  if (lines[0]?.trim() !== "---") {
    throw new Error("Prompt file must start with a `---` front-matter delimiter");
  }
  const closingIndex = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (closingIndex === -1) {
    throw new Error("Prompt file front-matter has no closing `---` delimiter");
  }

  const fields = new Map<string, string | readonly string[]>();
  for (const line of lines.slice(1, closingIndex)) {
    if (line.trim().length === 0) {
      continue;
    }
    const separatorIndex = line.indexOf(":");
    if (separatorIndex === -1) {
      throw new Error(`Malformed front-matter line (expected "key: value"): "${line}"`);
    }
    const key = line.slice(0, separatorIndex).trim();
    fields.set(key, parseValue(line.slice(separatorIndex + 1)));
  }

  const body = lines
    .slice(closingIndex + 1)
    .join("\n")
    .trim();

  return { fields, body };
}

function requireString(fields: FrontMatterFields, key: string): string {
  const value = fields.get(key);
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`Prompt file front-matter is missing required field "${key}"`);
  }
  return value;
}

function readContextSlices(fields: FrontMatterFields): readonly string[] {
  const raw = fields.get("contextSlices");
  return Array.isArray(raw) ? raw : [];
}

export function parsePromptFile(raw: string): PromptFile {
  const { fields, body } = parseFrontMatterBlock(raw);

  const stepRaw = requireString(fields, "step");
  const step = Number(stepRaw);
  if (!Number.isInteger(step)) {
    throw new Error(`Prompt file front-matter "step" must be an integer, got "${stepRaw}"`);
  }

  return {
    frontMatter: {
      mode: requireString(fields, "mode"),
      methodId: requireString(fields, "methodId"),
      step,
      version: requireString(fields, "version"),
      outputSchema: requireString(fields, "outputSchema"),
      contextSlices: readContextSlices(fields),
    },
    body,
  };
}

/** Faz 10/K1/§2.1: same shape as `parsePromptFile`, minus `step`/`methodId`, plus `purpose`. */
export function parseWholeProjectPromptFile(raw: string): WholeProjectPromptFile {
  const { fields, body } = parseFrontMatterBlock(raw);

  return {
    frontMatter: {
      mode: requireString(fields, "mode"),
      purpose: requireString(fields, "purpose"),
      version: requireString(fields, "version"),
      outputSchema: requireString(fields, "outputSchema"),
      contextSlices: readContextSlices(fields),
    },
    body,
  };
}
