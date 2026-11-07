export type FirmsSyncRateLimitDecision =
  { allowed: true } | { allowed: false; retryAfterSeconds: number };

export function evaluateFirmsSyncRateLimit(args: {
  lastStartedAt: Date | null;
  now: Date;
  intervalMinutes: number;
}): FirmsSyncRateLimitDecision {
  if (args.lastStartedAt === null) {
    return { allowed: true };
  }

  const nextAllowedAt =
    args.lastStartedAt.getTime() + args.intervalMinutes * 60_000;
  const retryAfterSeconds = Math.ceil(
    (nextAllowedAt - args.now.getTime()) / 1_000,
  );

  return retryAfterSeconds > 0
    ? { allowed: false, retryAfterSeconds }
    : { allowed: true };
}
