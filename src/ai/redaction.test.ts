import { describe, expect, test } from "vitest";
import { resolveRedactionPolicy } from "./redaction";

describe("resolveRedactionPolicy", () => {
  test("defaults to off/empty-terms when given undefined", () => {
    expect(resolveRedactionPolicy(undefined)).toEqual({ mode: "off", terms: [], preserveNumbers: true });
  });

  test("defaults to off/empty-terms for an empty policy object (pre-J2 fixtures)", () => {
    expect(resolveRedactionPolicy({})).toEqual({ mode: "off", terms: [], preserveNumbers: true });
  });

  test("passes through a real customers-mode policy unchanged", () => {
    const resolved = resolveRedactionPolicy({ mode: "customers", terms: ["Acme Corp"], preserveNumbers: true });

    expect(resolved).toEqual({ mode: "customers", terms: ["Acme Corp"], preserveNumbers: true });
  });

  test("defaults terms to an empty array when mode is set but terms is not", () => {
    expect(resolveRedactionPolicy({ mode: "customers" })).toEqual({
      mode: "customers",
      terms: [],
      preserveNumbers: true,
    });
  });

  test("preserveNumbers is always true regardless of input", () => {
    expect(resolveRedactionPolicy({ mode: "off" }).preserveNumbers).toBe(true);
  });
});
