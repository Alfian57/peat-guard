import { purgeExpiredMrvDrafts } from "@/lib/server/mrv/documents";
import { prisma } from "@/lib/prisma";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";
import { processNextReportAnalysis } from "@/lib/server/reports/ai-job";
import { runFirmsSyncJob } from "@/scripts/jobs/firms-sync";
import { getNextWorkerDelayMs } from "@/scripts/worker-scheduler";

const stop = new AbortController();
for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.once(signal, () => stop.abort());
}

const jobs = [
  scheduleJob(
    "arsip MRV",
    async () => {
      await purgeExpiredMrvDrafts();
      return undefined;
    },
    3600_000,
  ),
  scheduleJob(
    "triase laporan",
    async () => {
      await processNextReportAnalysis();
      return undefined;
    },
    2_000,
  ),
];
if (process.env.NASA_FIRMS_MAP_KEY?.trim()) {
  try {
    jobs.push(
      scheduleJob(
        "NASA FIRMS",
        runFirmsSyncJob,
        getFirmsSyncIntervalMinutes() * 60_000,
      ),
    );
  } catch {
    console.error(
      "Jadwal NASA FIRMS tidak valid. Triase laporan tetap berjalan.",
    );
  }
}
console.info("PEATGUARD background worker started.");

if (!stop.signal.aborted) {
  await new Promise<void>((resolve) =>
    stop.signal.addEventListener("abort", () => resolve(), { once: true }),
  );
}
const deadline = setTimeout(() => process.exit(0), 25_000);
try {
  await Promise.all(jobs.map((job) => job()));
  await prisma.$disconnect();
} finally {
  clearTimeout(deadline);
}
console.info("PEATGUARD background worker stopped.");

function scheduleJob(
  label: string,
  run: () => Promise<number | undefined>,
  intervalMs: number,
) {
  let inFlight: Promise<void> | undefined;
  let timer: ReturnType<typeof setTimeout> | undefined;

  function tick() {
    if (stop.signal.aborted || inFlight) return;
    let nextDelayMs = intervalMs;
    inFlight = run()
      .then((retryAfterSeconds) => {
        nextDelayMs = getNextWorkerDelayMs(intervalMs, retryAfterSeconds);
      })
      .catch(() => console.error("Pekerjaan worker gagal:", label))
      .finally(() => {
        inFlight = undefined;
        if (!stop.signal.aborted) {
          timer = setTimeout(tick, nextDelayMs);
        }
      });
  }

  tick();
  return async () => {
    if (timer !== undefined) clearTimeout(timer);
    await inFlight;
  };
}
