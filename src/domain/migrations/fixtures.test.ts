import { describe, expect, test } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { strFromU8, unzipSync } from "fflate";
import { ProjectModelSchema } from "../model/projectModel";
import { findOrphanedReferences } from "../selectors";

/**
 * D-62: the container-level half of this guarantee (does the zip open, do
 * manifest/project ids agree) lives in `src-tauri/tests/fixtures.rs`. This
 * file covers the `ProjectModel` shape half — these fixtures are generated
 * by `src-tauri/src/bin/gen_ppsx_fixtures.rs`, never by this test.
 */
const FIXTURES_DIR = join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "fixtures", "ppsx");

function loadFixtureProject(fileName: string): unknown {
  const bytes = readFileSync(join(FIXTURES_DIR, fileName));
  const files = unzipSync(new Uint8Array(bytes));
  const projectJsonBytes = files["project.json"];
  if (!projectJsonBytes) {
    throw new Error(`${fileName}: archive has no project.json`);
  }
  return JSON.parse(strFromU8(projectJsonBytes));
}

describe("ppsx fixture corpus (D-62)", () => {
  test("the fixture directory contains exactly the 5 kinds (D-62's original 4 plus Faz 10/K2's deliberately-bad)", () => {
    const files = readdirSync(FIXTURES_DIR)
      .filter((name) => name.endsWith(".ppsx"))
      .sort();
    expect(files).toEqual([
      "deliberately-bad.ppsx",
      "fully-populated.ppsx",
      "minimal.ppsx",
      "turkish-text.ppsx",
      "unknown-method.ppsx",
    ]);
  });

  test("minimal.ppsx parses as a valid ProjectModel", () => {
    const result = ProjectModelSchema.safeParse(loadFixtureProject("minimal.ppsx"));
    expect(result.success).toBe(true);
  });

  test("fully-populated.ppsx parses as a valid ProjectModel", () => {
    const result = ProjectModelSchema.safeParse(loadFixtureProject("fully-populated.ppsx"));
    expect(result.success).toBe(true);
  });

  test("fully-populated.ppsx round-trips its entries, sign-off and round history", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("fully-populated.ppsx"));
    expect(project.steps[1].entries).toHaveLength(1);
    expect(project.steps[4].entries).toHaveLength(1);
    expect(project.signOff.approvedBy?.name).toBe("C. Demir");
    expect(project.rounds).toHaveLength(1);
  });

  /**
   * D-116 (Phase 6b): `Entry.references[]` has to survive the **real** writer
   * and the real reader, not just an in-memory command round-trip. Rust never
   * parses entries — it treats `project.json` as bytes — so this is the test
   * that turns "it survives by construction" into an observation.
   */
  test("fully-populated.ppsx round-trips cross-step references exactly", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("fully-populated.ppsx"));
    const countermeasure = project.steps[5].entries[0];

    expect(countermeasure?.methodId).toBe("countermeasure");
    expect(countermeasure?.references).toEqual([
      { role: "rootCause", targetEntryId: "entry-step4" },
      { role: "rootCause", targetEntryId: "entry-deleted-long-ago" },
    ]);
  });

  /**
   * D-117: referential integrity is *not* checked at load. A file whose
   * reference target was deleted before it was last saved must open exactly
   * as cleanly as one whose targets all resolve — D-59's read-only-open
   * promise depends on it.
   */
  test("fully-populated.ppsx opens cleanly despite carrying a dangling reference", () => {
    const result = ProjectModelSchema.safeParse(loadFixtureProject("fully-populated.ppsx"));

    expect(result.success).toBe(true);
  });

  test("the dangling reference is surfaced by the derived selector, not by the parser", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("fully-populated.ppsx"));
    const orphans = findOrphanedReferences(project);

    expect(orphans).toHaveLength(1);
    expect(orphans[0]).toMatchObject({
      stepId: 5,
      entryId: "entry-step5-countermeasure",
      reference: { role: "rootCause", targetEntryId: "entry-deleted-long-ago" },
    });
  });

  /** D-128: an entry from a method with no reference roles carries no key at all. */
  test("entries written by methods with no reference roles carry no references key", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("fully-populated.ppsx"));

    expect("references" in project.steps[4].entries[0]!).toBe(false);
  });

  test("turkish-text.ppsx parses and preserves Turkish characters exactly", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("turkish-text.ppsx"));
    expect(project.meta.title).toBe("Kaynak Hatası — İğneli Şişli Çözümü");
    expect(project.meta.customer).toBe("Öztürk Otomotiv A.Ş.");
    expect(project.meta.owner.name).toBe("Gökçe Çağlıyan");
  });

  /**
   * Faz 10/K2/D-213: the "deliberately-bad project" half of Faz 10's own
   * acceptance scenario. Every S1-S8 mechanical gate reads this project as
   * clean (S4 and S8 are satisfied on their own narrow terms) — the point
   * is that it still carries three narrative breaks only a mock-auditor AI
   * review would catch, none of which `evaluateReadiness` can see.
   */
  test("deliberately-bad.ppsx parses as a valid ProjectModel and passes every mechanical S1-S8 gate", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("deliberately-bad.ppsx"));
    for (const stepId of [1, 2, 3, 4, 5] as const) {
      expect(project.steps[stepId].entries.length).toBeGreaterThan(0);
    }
    expect(project.steps[6].entries).toHaveLength(0);
    expect(project.steps[7].entries).toHaveLength(0);
  });

  test("deliberately-bad.ppsx's one confirmed root cause blames a person, not a system (P-46)", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("deliberately-bad.ppsx"));
    const hypothesis = project.steps[4].entries[0];
    expect(hypothesis?.methodId).toBe("hypothesis-verification");
    const rows = (hypothesis?.payload as { rows: { verdict: string; candidateCause: string }[] }).rows;
    expect(rows[0]?.verdict).toBe("confirmed");
    expect(rows[0]?.candidateCause).toContain("Operatör");
  });

  test("deliberately-bad.ppsx's Step 8 marks a document complete even though Step 6 implemented nothing", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("deliberately-bad.ppsx"));
    expect(project.steps[6].entries).toHaveLength(0);
    const documents = project.steps[8].entries[0];
    expect(documents?.methodId).toBe("document-updates-tracker");
    const payload = documents?.payload as { controlPlan: { status: string } };
    expect(payload.controlPlan.status).toBe("complete");
  });

  // D-52: an entry whose methodId this build has never heard of must still
  // round-trip untouched — that is the whole point of payload being z.unknown().
  test("unknown-method.ppsx parses and round-trips the unrecognised entry's payload untouched", () => {
    const project = ProjectModelSchema.parse(loadFixtureProject("unknown-method.ppsx"));
    const entry = project.steps[5].entries[0];

    expect(entry?.methodId).toBe("future-method-not-yet-invented");
    expect(entry?.payload).toEqual({
      shape: "nobody currently registered knows this",
      nested: { arbitrary: [1, 2, 3] },
    });
  });
});
