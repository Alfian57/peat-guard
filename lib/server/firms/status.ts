export type FirmsFreshnessStatus =
  | "fresh"
  | "partial"
  | "stale"
  | "unavailable"
  | "not_configured"
  | "configuration_error";

export function getFirmsFreshnessStatus(args: {
  configured: boolean;
  configurationValid: boolean;
  checkedAt: Date;
  expectedIntervalMinutes: number | null;
  lastDataSyncAt: Date | null;
  lastDataOutcome: "success" | "partial" | null;
}): FirmsFreshnessStatus {
  if (!args.configured) return "not_configured";
  if (!args.configurationValid) return "configuration_error";
  if (!args.lastDataSyncAt || !args.lastDataOutcome) return "unavailable";

  const intervalMinutes = args.expectedIntervalMinutes;
  if (intervalMinutes === null) return "configuration_error";

  const staleAfterMs = (intervalMinutes + 5) * 60_000;
  if (args.checkedAt.getTime() - args.lastDataSyncAt.getTime() > staleAfterMs) {
    return "stale";
  }

  return args.lastDataOutcome === "partial" ? "partial" : "fresh";
}
