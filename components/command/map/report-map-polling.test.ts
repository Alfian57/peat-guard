import { describe, expect, test } from "bun:test";

import {
  COMMAND_MAP_DATA_REFRESH_INTERVAL_MS,
  REPORT_MAP_REFRESH_INTERVAL_MS,
  startVisibleCommandMapPolling,
  startVisibleReportMapPolling,
  type ReportMapPollingScheduler,
} from "@/components/command/map/report-map-polling";

class TestVisibilityDocument {
  visibilityState: DocumentVisibilityState = "visible";
  private readonly visibilityListeners = new Set<() => void>();

  addVisibilityChangeListener(listener: () => void): void {
    this.visibilityListeners.add(listener);
  }

  removeVisibilityChangeListener(listener: () => void): void {
    this.visibilityListeners.delete(listener);
  }

  setVisibilityState(visibilityState: DocumentVisibilityState): void {
    this.visibilityState = visibilityState;
    this.visibilityListeners.forEach((listener) => listener());
  }
}

function createScheduler() {
  let nextIntervalId = 1;
  const callbacks = new Map<number, () => void>();
  const scheduledDelays: number[] = [];
  const clearedIntervals: number[] = [];
  const scheduler: ReportMapPollingScheduler = {
    setInterval(callback, delayMs) {
      const intervalId = nextIntervalId++;
      callbacks.set(intervalId, callback);
      scheduledDelays.push(delayMs);
      return intervalId;
    },
    clearInterval(intervalId) {
      callbacks.delete(intervalId);
      clearedIntervals.push(intervalId);
    },
  };

  return { callbacks, clearedIntervals, scheduledDelays, scheduler };
}

describe("startVisibleReportMapPolling", () => {
  test("polls every 30 seconds while visible, pauses when hidden, and refreshes on return", () => {
    const visibilityDocument = new TestVisibilityDocument();
    const { callbacks, clearedIntervals, scheduledDelays, scheduler } =
      createScheduler();
    let refreshCount = 0;

    const stop = startVisibleReportMapPolling(
      visibilityDocument,
      () => {
        refreshCount += 1;
      },
      scheduler,
    );

    expect(scheduledDelays).toEqual([REPORT_MAP_REFRESH_INTERVAL_MS]);
    const firstIntervalCallback = callbacks.get(1);
    firstIntervalCallback?.();
    expect(refreshCount).toBe(1);

    visibilityDocument.setVisibilityState("hidden");
    expect(clearedIntervals).toEqual([1]);
    callbacks.get(1)?.();
    expect(refreshCount).toBe(1);

    visibilityDocument.setVisibilityState("visible");
    expect(refreshCount).toBe(2);
    firstIntervalCallback?.();
    expect(refreshCount).toBe(2);
    expect(scheduledDelays).toEqual([
      REPORT_MAP_REFRESH_INTERVAL_MS,
      REPORT_MAP_REFRESH_INTERVAL_MS,
    ]);
    const secondIntervalCallback = callbacks.get(2);
    secondIntervalCallback?.();
    expect(refreshCount).toBe(3);

    stop();
    expect(clearedIntervals).toEqual([1, 2]);
    secondIntervalCallback?.();
    expect(refreshCount).toBe(3);
  });

  test("waits while initially hidden and removes the visibility listener on cleanup", () => {
    const visibilityDocument = new TestVisibilityDocument();
    visibilityDocument.visibilityState = "hidden";
    const { callbacks, scheduledDelays, scheduler } = createScheduler();
    let refreshCount = 0;

    const stop = startVisibleReportMapPolling(
      visibilityDocument,
      () => {
        refreshCount += 1;
      },
      scheduler,
    );

    expect(scheduledDelays).toEqual([]);
    visibilityDocument.setVisibilityState("visible");
    expect(refreshCount).toBe(1);
    expect(scheduledDelays).toEqual([REPORT_MAP_REFRESH_INTERVAL_MS]);

    stop();
    visibilityDocument.setVisibilityState("hidden");
    visibilityDocument.setVisibilityState("visible");
    expect(refreshCount).toBe(1);
    expect(callbacks.size).toBe(0);
  });
});

test("refreshes command map and FIRMS data every five minutes only while visible", () => {
  const visibilityDocument = new TestVisibilityDocument();
  const { callbacks, clearedIntervals, scheduledDelays, scheduler } =
    createScheduler();
  let refreshCount = 0;

  const stop = startVisibleCommandMapPolling(
    visibilityDocument,
    () => {
      refreshCount += 1;
    },
    scheduler,
  );

  expect(scheduledDelays).toEqual([COMMAND_MAP_DATA_REFRESH_INTERVAL_MS]);
  callbacks.get(1)?.();
  expect(refreshCount).toBe(1);
  visibilityDocument.setVisibilityState("hidden");
  callbacks.get(1)?.();
  expect(refreshCount).toBe(1);
  visibilityDocument.setVisibilityState("visible");
  expect(refreshCount).toBe(2);
  expect(clearedIntervals).toEqual([1]);
  stop();
});
