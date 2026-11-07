import { describe, expect, test } from "bun:test";

import { evaluateFirmsSyncRateLimit } from "@/lib/server/firms/rate-limit";

describe("evaluateFirmsSyncRateLimit", () => {
  const now = new Date("2026-11-16T10:00:00.000Z");

  test("allows the first sync", () => {
    expect(
      evaluateFirmsSyncRateLimit({
        lastStartedAt: null,
        now,
        intervalMinutes: 30,
      }),
    ).toEqual({ allowed: true });
  });

  test("blocks calls during the configured interval and reports retry time", () => {
    expect(
      evaluateFirmsSyncRateLimit({
        lastStartedAt: new Date("2026-11-16T09:45:00.000Z"),
        now,
        intervalMinutes: 30,
      }),
    ).toEqual({ allowed: false, retryAfterSeconds: 900 });
  });

  test("allows a call at the interval boundary", () => {
    expect(
      evaluateFirmsSyncRateLimit({
        lastStartedAt: new Date("2026-11-16T09:30:00.000Z"),
        now,
        intervalMinutes: 30,
      }),
    ).toEqual({ allowed: true });
  });
});
