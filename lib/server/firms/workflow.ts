import { FirmsProviderError } from "@/lib/server/firms/errors";
import type { FirmsHotspot } from "@/lib/server/firms/csv";
import type { AreaBounds, FirmsSourceBatch } from "@/lib/server/firms/client";
import type { FirmsIngestSource } from "@/lib/firms-sources";

export type FirmsSyncResult =
  | { status: "skipped"; reason: "not_configured" }
  | {
      status: "success";
      processedCount: number;
      completedAt: string;
      successfulSources: FirmsIngestSource[];
    }
  | {
      status: "partial";
      processedCount: number;
      completedAt: string;
      successfulSources: FirmsIngestSource[];
      failedSources: FirmsSourceBatch["failedSources"];
    };

export class FirmsSyncError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    readonly retryAfterSeconds?: number,
  ) {
    super("NASA FIRMS synchronization failed.");
    this.name = "FirmsSyncError";
  }
}

export type FirmsSyncDependencies = {
  fetchHotspots: (
    apiKey: string,
    area: AreaBounds,
  ) => Promise<FirmsSourceBatch>;
  reserveSyncSlot: (args: {
    actorId: string | null;
    intervalMinutes: number;
  }) => Promise<
    { allowed: true } | { allowed: false; retryAfterSeconds: number }
  >;
  persistSuccess: (args: {
    hotspots: FirmsHotspot[];
    successfulSources: FirmsIngestSource[];
    failedSources: FirmsSourceBatch["failedSources"];
    actorId: string | null;
    area: AreaBounds;
  }) => Promise<void>;
  persistFailure: (args: {
    actorId: string | null;
    errorCode: string;
    failedSources: FirmsSourceBatch["failedSources"];
  }) => Promise<void>;
  now: () => Date;
};

export async function performFirmsSync(
  args: {
    apiKey: string | null;
    area: AreaBounds;
    actorId: string | null;
    intervalMinutes: number;
  },
  dependencies: FirmsSyncDependencies,
): Promise<FirmsSyncResult> {
  const apiKey = args.apiKey?.trim();

  if (!apiKey) {
    return { status: "skipped", reason: "not_configured" };
  }

  let slot: Awaited<ReturnType<typeof dependencies.reserveSyncSlot>>;
  try {
    slot = await dependencies.reserveSyncSlot({
      actorId: args.actorId,
      intervalMinutes: args.intervalMinutes,
    });
  } catch {
    throw new FirmsSyncError(503, "storage_unavailable");
  }

  if (!slot.allowed) {
    throw new FirmsSyncError(429, "rate_limited", slot.retryAfterSeconds);
  }

  let batch: FirmsSourceBatch;

  try {
    batch = await dependencies.fetchHotspots(apiKey, args.area);
  } catch (error) {
    const errorCode =
      error instanceof FirmsProviderError
        ? error.code
        : "provider_request_failed";

    try {
      await dependencies.persistFailure({
        actorId: args.actorId,
        errorCode,
        failedSources: [],
      });
    } catch {
      // A database outage must not hide the original provider error.
    }

    throw new FirmsSyncError(502, "provider_unavailable");
  }

  if (batch.successfulSources.length === 0) {
    try {
      await dependencies.persistFailure({
        actorId: args.actorId,
        errorCode: "all_sources_failed",
        failedSources: batch.failedSources,
      });
    } catch {
      // Keep the provider failure as the actionable result if audit storage is down.
    }

    throw new FirmsSyncError(502, "provider_unavailable");
  }

  try {
    await dependencies.persistSuccess({
      hotspots: batch.hotspots,
      successfulSources: batch.successfulSources,
      failedSources: batch.failedSources,
      actorId: args.actorId,
      area: args.area,
    });
  } catch {
    throw new FirmsSyncError(503, "storage_unavailable");
  }

  const completion = {
    processedCount: batch.hotspots.length,
    completedAt: dependencies.now().toISOString(),
    successfulSources: batch.successfulSources,
  };

  return batch.failedSources.length > 0
    ? { status: "partial", ...completion, failedSources: batch.failedSources }
    : { status: "success", ...completion };
}
