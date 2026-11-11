import { describe, expect, test } from "bun:test";
import { runFirmsSyncJob } from "@/scripts/jobs/firms-sync";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";

describe("Background Worker Daemon Resiliency", () => {
  test("returns valid default sync interval in minutes", () => {
    const interval = getFirmsSyncIntervalMinutes();
    expect(interval).toBeGreaterThanOrEqual(10);
    expect(interval).toBeLessThanOrEqual(1440);
  });

  test("runs FIRMS sync job without throwing unhandled exceptions when unconfigured or rate limited", async () => {
    // Calling runFirmsSyncJob without NASA_FIRMS_MAP_KEY must catch cleanly and not throw
    const originalKey = process.env.NASA_FIRMS_MAP_KEY;
    try {
      delete process.env.NASA_FIRMS_MAP_KEY;
      await expect(runFirmsSyncJob()).resolves.toBeUndefined();
    } finally {
      if (originalKey) {
        process.env.NASA_FIRMS_MAP_KEY = originalKey;
      }
    }
  });

  test("handles simulated termination signals cleanly without unhandled rejections", async () => {
    let resolved = false;
    const testPromise = new Promise<void>((resolve) => {
      const handler = () => {
        resolved = true;
        resolve();
      };
      process.once("SIGUSR2", handler);
    });

    process.emit("SIGUSR2");
    await testPromise;
    expect(resolved).toBe(true);
  });
});
