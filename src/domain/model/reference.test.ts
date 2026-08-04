import { describe, expect, it } from "vitest";
import { EntrySchema } from "./entry";
import { EntryReferenceSchema, REFERENCE_ROLES } from "./reference";

const baseEntry = {
  id: "e1",
  methodId: "countermeasure",
  title: "Poka-yoke on station 30",
  order: 0,
  a3Visibility: "primary" as const,
  payload: {},
  images: [],
  createdAt: "2026-08-03T00:00:00.000Z",
  updatedAt: "2026-08-03T00:00:00.000Z",
  provenance: { origin: "human" as const },
};

describe("EntryReferenceSchema", () => {
  it("accepts the four documented role constants", () => {
    for (const role of Object.values(REFERENCE_ROLES)) {
      expect(EntryReferenceSchema.parse({ role, targetEntryId: "t" }).role).toBe(role);
    }
  });

  /**
   * D-116: `role` is a loose string, not a `z.enum`. A newer build that
   * introduces a fifth relation must round-trip through an older one without
   * a migration — this is the concrete behaviour that decision buys.
   */
  it("accepts a role this build has never heard of", () => {
    const parsed = EntryReferenceSchema.parse({ role: "yokotenTarget", targetEntryId: "t" });

    expect(parsed).toEqual({ role: "yokotenTarget", targetEntryId: "t" });
  });

  it("preserves unknown keys (D-51 loose object)", () => {
    const parsed = EntryReferenceSchema.parse({ role: "rootCause", targetEntryId: "t", note: "future field" });

    expect(parsed).toMatchObject({ note: "future field" });
  });

  it("rejects a reference with no target", () => {
    expect(EntryReferenceSchema.safeParse({ role: "rootCause" }).success).toBe(false);
  });
});

describe("EntrySchema with references", () => {
  it("round-trips a reference list unchanged", () => {
    const references = [
      { role: REFERENCE_ROLES.rootCause, targetEntryId: "rc-1" },
      { role: REFERENCE_ROLES.rootCause, targetEntryId: "rc-2" },
    ];

    expect(EntrySchema.parse({ ...baseEntry, references }).references).toEqual(references);
  });

  /**
   * D-116: `references` is optional precisely so every entry written before
   * Phase 6b parses with no migration. Phases 2–6a wrote none.
   */
  it("parses a pre-6b entry that has no references field at all", () => {
    const parsed = EntrySchema.parse(baseEntry);

    expect(parsed.references).toBeUndefined();
  });

  it("does not invent an empty array for an entry that never had one", () => {
    expect("references" in EntrySchema.parse(baseEntry)).toBe(false);
  });

  /** D-117: nothing at parse time cares whether the target resolves. */
  it("parses an entry whose reference points at an id that does not exist", () => {
    const parsed = EntrySchema.parse({
      ...baseEntry,
      references: [{ role: "rootCause", targetEntryId: "deleted-long-ago" }],
    });

    expect(parsed.references).toHaveLength(1);
  });
});
