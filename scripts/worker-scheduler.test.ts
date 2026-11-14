import { expect, test } from "bun:test";

import { getNextWorkerDelayMs } from "@/scripts/worker-scheduler";

test("schedules normally after a completed worker run", () => {
  expect(getNextWorkerDelayMs(30 * 60_000)).toBe(30 * 60_000);
});

test("waits until just after a shared cooldown expires", () => {
  expect(getNextWorkerDelayMs(30 * 60_000, 900)).toBe(901_000);
  expect(getNextWorkerDelayMs(30 * 60_000, 0)).toBe(1_000);
});
