export const REPORT_MAP_REFRESH_INTERVAL_MS = 30_000;

export type VisibilitySource = {
  visibilityState: DocumentVisibilityState;
  addVisibilityChangeListener: (listener: () => void) => void;
  removeVisibilityChangeListener: (listener: () => void) => void;
};

export type ReportMapPollingScheduler = {
  setInterval: (callback: () => void, delayMs: number) => number;
  clearInterval: (intervalId: number) => void;
};

export function startVisibleReportMapPolling(
  visibilitySource: VisibilitySource,
  refresh: () => void,
  scheduler: ReportMapPollingScheduler,
): () => void {
  let intervalId: number | null = null;

  const stopPolling = () => {
    if (intervalId === null) return;
    scheduler.clearInterval(intervalId);
    intervalId = null;
  };

  const startPolling = () => {
    if (intervalId !== null) return;
    const nextIntervalId = scheduler.setInterval(() => {
      if (
        intervalId === nextIntervalId &&
        visibilitySource.visibilityState === "visible"
      ) {
        refresh();
      }
    }, REPORT_MAP_REFRESH_INTERVAL_MS);
    intervalId = nextIntervalId;
  };

  const handleVisibilityChange = () => {
    if (visibilitySource.visibilityState === "visible") {
      refresh();
      startPolling();
      return;
    }

    stopPolling();
  };

  visibilitySource.addVisibilityChangeListener(handleVisibilityChange);
  if (visibilitySource.visibilityState === "visible") {
    startPolling();
  }

  return () => {
    stopPolling();
    visibilitySource.removeVisibilityChangeListener(handleVisibilityChange);
  };
}
