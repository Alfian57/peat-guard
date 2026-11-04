import { runFirmsSyncJob } from "@/scripts/jobs/firms-sync";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";

const shutdownSignals = ["SIGINT", "SIGTERM"] as const;
const hasFirmsKey = Boolean(process.env.NASA_FIRMS_MAP_KEY?.trim());

if (!hasFirmsKey) {
  console.info(
    "PEATGUARD worker is idle: NASA_FIRMS_MAP_KEY is not configured.",
  );
  await waitForShutdown();
} else {
  const syncIntervalMinutes = getFirmsSyncIntervalMinutes();
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

function waitForShutdown(): Promise<void> {
  return new Promise((resolve) => {
    for (const signal of shutdownSignals) {
      process.once(signal, resolve);
    }
  });
}
