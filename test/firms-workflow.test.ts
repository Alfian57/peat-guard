import { describe, expect, mock, test } from "bun:test";

import { FirmsProviderError } from "@/lib/server/firms/errors";
import {
  FirmsSyncError,
  performFirmsSync,
  type FirmsSyncDependencies,
} from "@/lib/server/firms/workflow";

const area = { west: 109, south: -5, east: 117, north: 2 };

function createDependencies(
  overrides: Partial<FirmsSyncDependencies> = {},
): FirmsSyncDependencies {
  return {
    fetchHotspots: mock(async () => []),
    persistSuccess: mock(async () => {}),
    persistFailure: mock(async () => {}),
    now: () => new Date("2026-11-15T10:00:00.000Z"),
    ...overrides,
  };
}

describe("performFirmsSync", () => {
  test("skips cleanly without a key and makes no provider or database calls", async () => {
    const dependencies = createDependencies();

    await expect(
      performFirmsSync({ apiKey: null, area, actorId: null }, dependencies),
    ).resolves.toEqual({ status: "skipped", reason: "not_configured" });
    expect(dependencies.fetchHotspots).not.toHaveBeenCalled();
    expect(dependencies.persistSuccess).not.toHaveBeenCalled();
    expect(dependencies.persistFailure).not.toHaveBeenCalled();
  });

  test("records provider failure without touching hotspot data", async () => {
    const dependencies = createDependencies({
      fetchHotspots: mock(async () => {
        throw new FirmsProviderError("provider_http_error");
      }),
    });

    await expect(
      performFirmsSync(
        { apiKey: "test-key", area, actorId: "actor-1" },
        dependencies,
      ),
    ).rejects.toBeInstanceOf(FirmsSyncError);
    expect(dependencies.persistSuccess).not.toHaveBeenCalled();
    expect(dependencies.persistFailure).toHaveBeenCalledWith({
      actorId: "actor-1",
      errorCode: "provider_http_error",
    });
  });

  test("persists all parsed data before reporting a successful sync", async () => {
    const dependencies = createDependencies({
      fetchHotspots: mock(async () => [
        {
          source: "VIIRS_SNPP_NRT",
          externalId: "stable-hash",
          latitude: -2.001,
          longitude: 113.904,
          brightnessKelvin: 315.4,
          confidence: "nominal",
          acquiredAt: new Date("2026-11-15T09:24:00.000Z"),
        },
      ]),
    });

    await expect(
      performFirmsSync(
        { apiKey: "test-key", area, actorId: null },
        dependencies,
      ),
    ).resolves.toEqual({
      status: "success",
      processedCount: 1,
      completedAt: "2026-11-15T10:00:00.000Z",
    });
    expect(dependencies.persistSuccess).toHaveBeenCalledTimes(1);
  });
});
