import { describe, expect, test } from "vitest";
import en from "./locales/en/common.json";
import tr from "./locales/tr/common.json";

/**
 * D-231 (Faz 12 M1): CLAUDE.md's own "TR and EN keys are added together" rule was, until
 * this test, enforced by discipline alone — nothing mechanical protected the 957/957 parity
 * confirmed by hand during the Faz 12 scope session (D-230) from drifting the next time either
 * locale file is edited without its twin. This is that mechanism: flatten both JSON trees to
 * their leaf-key paths and diff the two sets, so a future one-sided addition/removal/rename
 * fails loudly with the exact missing keys named, rather than silently shipping a UI string
 * that falls back to the other language.
 */

type JsonValue = string | number | boolean | null | { [key: string]: JsonValue };

function flattenKeys(node: JsonValue, prefix = ""): Set<string> {
  if (node === null || typeof node !== "object") {
    return new Set(prefix ? [prefix] : []);
  }

  const keys = new Set<string>();
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key;
    for (const leaf of flattenKeys(value, path)) {
      keys.add(leaf);
    }
  }
  return keys;
}

describe("TR/EN locale key parity", () => {
  test("tr/common.json and en/common.json have exactly the same set of leaf keys", () => {
    const trKeys = flattenKeys(tr as JsonValue);
    const enKeys = flattenKeys(en as JsonValue);

    const missingFromEn = [...trKeys].filter((key) => !enKeys.has(key)).sort();
    const missingFromTr = [...enKeys].filter((key) => !trKeys.has(key)).sort();

    expect({ missingFromEn, missingFromTr }).toEqual({ missingFromEn: [], missingFromTr: [] });
  });

  test("neither locale file is accidentally empty", () => {
    // A guard against the "both files got wiped, so the diff above passes trivially"
    // failure mode — the real parity check above is meaningless if both sets are empty.
    expect(flattenKeys(tr as JsonValue).size).toBeGreaterThan(900);
    expect(flattenKeys(en as JsonValue).size).toBeGreaterThan(900);
  });
});
