import { FirmsSyncError, syncNasaFirms } from "@/lib/server/firms/sync";

export async function runFirmsSyncJob(): Promise<number | undefined> {
  try {
    const result = await syncNasaFirms();

    if (result.status === "skipped") {
      console.info("NASA FIRMS sync skipped: map key is not configured.");
      return;
    }

    console.info("NASA FIRMS sync completed.", {
      status: result.status,
      processedCount: result.processedCount,
      completedAt: result.completedAt,
      successfulSources: result.successfulSources,
      failedSources: result.status === "partial" ? result.failedSources : [],
    });
    return undefined;
  } catch (error) {
    if (error instanceof FirmsSyncError && error.code === "rate_limited") {
      console.info("NASA FIRMS sync skipped by shared rate limit.", {
        retryAfterSeconds: error.retryAfterSeconds,
      });
      return error.retryAfterSeconds ?? 1;
    }

    console.error("NASA FIRMS sync failed.", {
      code: error instanceof FirmsSyncError ? error.code : "unexpected_error",
    });
    return undefined;
  }
}
