import { describe, expect, test } from "vitest";
import { ManifestSchema } from "./manifest";

function validManifest() {
  const now = new Date().toISOString();
  return { id: "p1", schemaVersion: 1, appVersion: "0.1.0", created: now, modified: now };
}

describe("ManifestSchema", () => {
  test("parses a well-formed manifest", () => {
    expect(ManifestSchema.safeParse(validManifest()).success).toBe(true);
  });

  test("rejects a non-integer schemaVersion", () => {
    const result = ManifestSchema.safeParse({ ...validManifest(), schemaVersion: 1.5 });
    expect(result.success).toBe(false);
  });

  test("rejects a non-ISO created timestamp", () => {
    const result = ManifestSchema.safeParse({ ...validManifest(), created: "yesterday" });
    expect(result.success).toBe(false);
  });

  // D-51's loose-schema reasoning extends to the manifest: an older build
  // must not delete a manifest field only a newer build understands.
  test("preserves an unrecognised field instead of stripping it", () => {
    const parsed = ManifestSchema.parse({ ...validManifest(), futureField: "kept" });
    expect(parsed).toMatchObject({ futureField: "kept" });
  });
});
