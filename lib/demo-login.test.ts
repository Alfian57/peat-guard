import { describe, expect, test } from "bun:test";

import { demoLoginIsEnabled, demoPasswordForRole } from "@/lib/demo-login";
import { assertRoleAccess, AuthorizationError } from "@/lib/role-access";

describe("demo login gate", () => {
  test("is enabled only when the flag is on outside production", () => {
    expect(demoLoginIsEnabled("1", "development")).toBe(true);
    expect(demoLoginIsEnabled("0", "development")).toBe(false);
    expect(demoLoginIsEnabled("1", "production")).toBe(false);
    expect(demoLoginIsEnabled("", "development")).toBe(false);
  });

  test("derives a stable server-side password per role", () => {
    const firstValue = demoPasswordForRole("RELAWAN", "x".repeat(32));
    const secondValue = demoPasswordForRole("RELAWAN", "x".repeat(32));
    const otherRoleValue = demoPasswordForRole("POSKO", "x".repeat(32));

    expect(firstValue).toBe(secondValue);
    expect(firstValue).not.toBe(otherRoleValue);
    expect(firstValue).not.toContain("x".repeat(32));
  });
});

describe("role access", () => {
  test("rejects anonymous requests with 401", () => {
    try {
      assertRoleAccess(false, "RELAWAN", ["RELAWAN"]);
      throw new Error("Expected authorization to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthorizationError);
      expect((error as AuthorizationError).status).toBe(401);
    }
  });

  test("allows the assigned role and rejects another role", () => {
    expect(() => assertRoleAccess(true, "POSKO", ["POSKO"])).not.toThrow();

    try {
      assertRoleAccess(true, "RELAWAN", ["POSKO"]);
      throw new Error("Expected role authorization to be rejected.");
    } catch (error) {
      expect(error).toBeInstanceOf(AuthorizationError);
      expect((error as AuthorizationError).status).toBe(403);
    }
  });
});
