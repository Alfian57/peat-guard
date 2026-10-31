import { FirmsProviderError } from "@/lib/server/firms/errors";
import type { FirmsHotspot } from "@/lib/server/firms/csv";
import type { AreaBounds } from "@/lib/server/firms/client";

export type FirmsSyncResult =
  | { status: "skipped"; reason: "not_configured" }
  | {
      status: "success";
      processedCount: number;
      completedAt: string;
    };

export class FirmsSyncError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
  ) {
    super("NASA FIRMS synchronization failed.");
    this.name = "FirmsSyncError";
  }
}

export type FirmsSyncDependencies = {
  fetchHotspots: (apiKey: string, area: AreaBounds) => Promise<FirmsHotspot[]>;
  persistSuccess: (args: {
    hotspots: FirmsHotspot[];
    actorId: string | null;
    area: AreaBounds;
  }) => Promise<void>;
  persistFailure: (args: {
    actorId: string | null;
    errorCode: string;
  }) => Promise<void>;
  now: () => Date;
};

export async function performFirmsSync(
  args: {
    apiKey: string | null;
    area: AreaBounds;
    actorId: string | null;
  },
  dependencies: FirmsSyncDependencies,
): Promise<FirmsSyncResult> {
  const apiKey = args.apiKey?.trim();

  if (!apiKey) {
    return { status: "skipped", reason: "not_configured" };
  }

  let hotspots: FirmsHotspot[];

  try {
    hotspots = await dependencies.fetchHotspots(apiKey, args.area);
  } catch (error) {
    const errorCode =
      error instanceof FirmsProviderError
        ? error.code
        : "provider_request_failed";

    try {
      await dependencies.persistFailure({
        actorId: args.actorId,
        errorCode,
      });
    } catch {
      // A database outage must not hide the original provider error.
    }

    throw new FirmsSyncError(502, "provider_unavailable");
  }

  try {
    await dependencies.persistSuccess({
      hotspots,
      actorId: args.actorId,
      area: args.area,
    });
  } catch {
    throw new FirmsSyncError(503, "storage_unavailable");
  }

  return {
    status: "success",
    processedCount: hotspots.length,
    completedAt: dependencies.now().toISOString(),
  };
}
