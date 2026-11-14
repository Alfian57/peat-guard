export function getNextWorkerDelayMs(
  intervalMs: number,
  retryAfterSeconds?: number,
): number {
  if (retryAfterSeconds === undefined) return intervalMs;
  return (Math.max(0, retryAfterSeconds) + 1) * 1_000;
}
