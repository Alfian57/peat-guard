import { runFirmsSyncJob } from "@/scripts/jobs/firms-sync";

const shutdownSignals = ["SIGINT", "SIGTERM"] as const;
const hasFirmsKey = Boolean(process.env.NASA_FIRMS_MAP_KEY?.trim());

if (!hasFirmsKey) {
  console.info(
    "PEATGUARD worker is idle: NASA_FIRMS_MAP_KEY is not configured.",
  );
  await waitForShutdown();
} else {
  const syncIntervalMinutes = readSyncIntervalMinutes();
  let syncRunning = false;

  const runIfIdle = async () => {
    if (syncRunning) {
      return;
    }

    syncRunning = true;

    try {
      await runFirmsSyncJob();
    } finally {
      syncRunning = false;
    }
  };

  await runIfIdle();
  const timer = setInterval(
    () => void runIfIdle(),
    syncIntervalMinutes * 60_000,
  );

  console.info("PEATGUARD FIRMS worker scheduled.", {
    intervalMinutes: syncIntervalMinutes,
  });

  await waitForShutdown();
  clearInterval(timer);
}

console.info("PEATGUARD background worker stopped.");

function readSyncIntervalMinutes(): number {
  const rawValue = process.env.NASA_FIRMS_SYNC_INTERVAL_MINUTES?.trim();

  if (!rawValue) {
    return 30;
  }

  const minutes = Number(rawValue);

  if (!Number.isInteger(minutes) || minutes < 5 || minutes > 1_440) {
    throw new Error(
      "NASA_FIRMS_SYNC_INTERVAL_MINUTES must be an integer between 5 and 1440.",
    );
  }

  return minutes;
}

function waitForShutdown(): Promise<void> {
  return new Promise((resolve) => {
    for (const signal of shutdownSignals) {
      process.once(signal, resolve);
    }
  });
}
