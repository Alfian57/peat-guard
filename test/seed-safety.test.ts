import { describe, expect, test } from "bun:test";

import { isAllowedDemoSeedTarget } from "../prisma/seed-safety";

describe("demo seed target safety", () => {
  test("allows local PostgreSQL demo databases outside production", () => {
    expect(
      isAllowedDemoSeedTarget(
        "postgresql://demo:secret@localhost:5432/peat_guard",
        "development",
        undefined,
      ),
    ).toBe(true);
  });

  test("blocks production mode without an explicit reset opt-in", () => {
    expect(
      isAllowedDemoSeedTarget(
        "postgresql://demo:secret@postgres:5432/peat_guard",
        "production",
        undefined,
      ),
    ).toBe(false);
  });

  test("allows the Compose PostgreSQL host only with explicit reset opt-in", () => {
    expect(
      isAllowedDemoSeedTarget(
        "postgresql://demo:secret@postgres-db:5432/peat_guard",
        "production",
        "1",
      ),
    ).toBe(true);
  });

  test("does not let the reset opt-in authorize arbitrary remote hosts", () => {
    expect(
      isAllowedDemoSeedTarget(
        "postgresql://demo:secret@db.example.test:5432/peat_guard",
        "production",
        "1",
      ),
    ).toBe(false);
  });

  test("does not accept a different Compose alias for a reset seed", () => {
    expect(
      isAllowedDemoSeedTarget(
        "postgresql://demo:secret@postgres:5432/peat_guard",
        "production",
        "1",
      ),
    ).toBe(false);
  });

  test("rejects unsupported and malformed database URLs", () => {
    expect(
      isAllowedDemoSeedTarget(
        "mysql://localhost/peat_guard",
        "development",
        undefined,
      ),
    ).toBe(false);
    expect(isAllowedDemoSeedTarget("not-a-url", "development", undefined)).toBe(
      false,
    );
  });
});
