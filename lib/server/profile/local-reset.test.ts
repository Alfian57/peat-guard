import { describe, expect, it } from "bun:test";

import {
  assertLocalDatabaseUrl,
  resolveSafeUploadsDirectory,
} from "./local-reset";

describe("local fresh reset safeguards", () => {
  it("accepts only the local development database", () => {
    expect(
      assertLocalDatabaseUrl(
        "postgresql://postgres:postgres@localhost:5432/peat_guard?schema=public",
      ).hostname,
    ).toBe("localhost");
    expect(() =>
      assertLocalDatabaseUrl("postgresql://db.example.com/app/peat_guard"),
    ).toThrow();
    expect(() =>
      assertLocalDatabaseUrl("postgresql://localhost:5432/postgres"),
    ).toThrow();
    expect(() =>
      assertLocalDatabaseUrl(
        "postgresql://localhost:5432/peat_guard",
        "production",
      ),
    ).toThrow();
  });

  it("restricts cleanup to a .data/uploads directory", () => {
    expect(resolveSafeUploadsDirectory(undefined, "/workspace/app")).toBe(
      "/workspace/app/.data/uploads",
    );
    expect(() =>
      resolveSafeUploadsDirectory("/workspace/app", "/workspace/app"),
    ).toThrow();
    expect(() =>
      resolveSafeUploadsDirectory("/tmp/uploads", "/workspace/app"),
    ).toThrow();
    expect(() =>
      resolveSafeUploadsDirectory(
        "/workspace/other/.data/uploads",
        "/workspace/app",
      ),
    ).toThrow();
  });
});
