export function getFirmsSyncIntervalMinutes(
  rawValue = process.env.NASA_FIRMS_SYNC_INTERVAL_MINUTES?.trim(),
): number {
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
