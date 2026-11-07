import {
  getFirmsConfiguration,
  fetchRecentHotspots,
} from "@/lib/server/firms/client";
import { FirmsProviderError } from "@/lib/server/firms/errors";
import {
  FirmsSyncError,
  performFirmsSync,
  type FirmsSyncDependencies,
  type FirmsSyncResult,
} from "@/lib/server/firms/workflow";
import {
  recordSyncFailure,
  reserveFirmsSyncSlot,
  upsertAndRecordSuccess,
} from "@/lib/server/firms/repository";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";

export { FirmsSyncError };

const productionDependencies: FirmsSyncDependencies = {
  fetchHotspots: fetchRecentHotspots,
  reserveSyncSlot: reserveFirmsSyncSlot,
  persistSuccess: upsertAndRecordSuccess,
  persistFailure: recordSyncFailure,
  now: () => new Date(),
};

let activeSync: Promise<FirmsSyncResult> | null = null;

export function syncNasaFirms(
  actorId: string | null = null,
): Promise<FirmsSyncResult> {
  if (activeSync) {
    return activeSync;
  }

  activeSync = runConfiguredSync(actorId).finally(() => {
    activeSync = null;
  });

  return activeSync;
}

async function runConfiguredSync(
  actorId: string | null,
): Promise<FirmsSyncResult> {
  let configuration: ReturnType<typeof getFirmsConfiguration>;

  try {
    configuration = getFirmsConfiguration();
  } catch (error) {
    if (error instanceof FirmsProviderError) {
      throw new FirmsSyncError(503, "invalid_configuration");
    }

    throw error;
  }

  if (!configuration.apiKey) {
    return { status: "skipped", reason: "not_configured" };
  }

  let intervalMinutes: number;
  try {
    intervalMinutes = getFirmsSyncIntervalMinutes();
  } catch {
    throw new FirmsSyncError(503, "invalid_configuration");
  }

  return performFirmsSync(
    {
      apiKey: configuration.apiKey,
      area: configuration.area,
      actorId,
      intervalMinutes,
    },
    productionDependencies,
  );
}
