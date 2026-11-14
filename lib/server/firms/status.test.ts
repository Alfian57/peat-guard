import { expect, test } from "bun:test";

import { getFirmsFreshnessStatus } from "@/lib/server/firms/status";

const checkedAt = new Date("2026-11-18T10:00:00.000Z");

test("distinguishes unconfigured and invalid provider schedules", () => {
  expect(
    getFirmsFreshnessStatus({
      configured: false,
      configurationValid: false,
      checkedAt,
      expectedIntervalMinutes: null,
      lastDataSyncAt: null,
      lastDataOutcome: null,
    }),
  ).toBe("not_configured");
  expect(
    getFirmsFreshnessStatus({
      configured: true,
      configurationValid: false,
      checkedAt,
      expectedIntervalMinutes: null,
      lastDataSyncAt: null,
      lastDataOutcome: null,
    }),
  ).toBe("configuration_error");
});

test("reports recent partial syncs and ages old data without calling it fresh", () => {
  const recentPartial = new Date("2026-11-18T09:40:00.000Z");
  expect(
    getFirmsFreshnessStatus({
      configured: true,
      configurationValid: true,
      checkedAt,
      expectedIntervalMinutes: 30,
      lastDataSyncAt: recentPartial,
      lastDataOutcome: "partial",
    }),
  ).toBe("partial");

  expect(
    getFirmsFreshnessStatus({
      configured: true,
      configurationValid: true,
      checkedAt,
      expectedIntervalMinutes: 30,
      lastDataSyncAt: new Date("2026-11-18T09:00:00.000Z"),
      lastDataOutcome: "success",
    }),
  ).toBe("stale");
});
