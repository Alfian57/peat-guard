import { FirmsSyncError, syncNasaFirms } from "@/lib/server/firms/sync";

export async function runFirmsSyncJob(): Promise<void> {
  try {
    const result = await syncNasaFirms();

    if (result.status === "skipped") {
      console.info("NASA FIRMS sync skipped: map key is not configured.");
      return;
    }

    console.info("NASA FIRMS sync completed.", {
      processedCount: result.processedCount,
      completedAt: result.completedAt,
    });
  } catch (error) {
    if (error instanceof FirmsSyncError && error.code === "rate_limited") {
      console.info("NASA FIRMS sync skipped by shared rate limit.", {
        retryAfterSeconds: error.retryAfterSeconds,
      });
      return;
    }

    console.error("NASA FIRMS sync failed.", {
      code: error instanceof FirmsSyncError ? error.code : "unexpected_error",
    });
  }
}
