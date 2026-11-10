import { describe, expect, test } from "bun:test";

import { DEMO_USERS } from "@/lib/demo-login";
import { assertRoleAccess, AuthorizationError } from "@/lib/role-access";

describe("default accounts", () => {
  test("maps a seeded default account to each application role", () => {
    expect(DEMO_USERS.map((user) => user.email)).toEqual([
      "relawan@gmail.com",
      "posko@gmail.com",
      "verifikator@gmail.com",
    ]);
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
