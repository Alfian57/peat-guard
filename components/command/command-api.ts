import type { CommandHotspot } from "@/lib/server/firms/repository";
import type { CommandZone } from "@/lib/server/zones/data";
import type { CommandWaterPoint } from "@/lib/server/water/data";

export type CommandMapData = {
  zones: CommandZone[];
  waterPoints: CommandWaterPoint[];
  hotspots: CommandHotspot[];
};

export type FirmsSyncStatus = {
  configured: boolean;
  lastSuccessfulAt: string | null;
  lastAttemptAt: string | null;
  lastErrorCode: string | null;
  lastProcessedCount: number | null;
  storedHotspotCount: number;
};

export class CommandRequestError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "CommandRequestError";
  }
}

export async function requestCommandJson(
  url: string,
  init?: RequestInit,
): Promise<unknown> {
  let response: Response;
  const headers = new Headers(init?.headers);

  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  try {
    response = await fetch(url, {
      ...init,
      headers,
    });
  } catch {
    throw new CommandRequestError(
      "Koneksi belum tersedia. Periksa jaringan lalu coba kembali.",
    );
  }

  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    throw new CommandRequestError(
      "Respons server tidak dapat dibaca. Coba kembali.",
      response.status,
    );
  }

  if (!response.ok) {
    const message =
      isRecord(payload) && typeof payload.message === "string"
        ? payload.message
        : isRecord(payload) && typeof payload.error === "string"
          ? payload.error
          : "Permintaan belum dapat diproses. Coba kembali.";
    throw new CommandRequestError(message, response.status);
  }

  return payload;
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function isCommandMapData(value: unknown): value is CommandMapData {
  return (
    isRecord(value) &&
    Array.isArray(value.zones) &&
    value.zones.every(isCommandZone) &&
    Array.isArray(value.waterPoints) &&
    value.waterPoints.every(isCommandWaterPoint) &&
    Array.isArray(value.hotspots) &&
    value.hotspots.every(isCommandHotspot)
  );
}

export function isZonesResponse(
  value: unknown,
): value is { zones: CommandZone[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.zones) &&
    value.zones.every(isCommandZone)
  );
}

export function isZoneResponse(value: unknown): value is { zone: CommandZone } {
  return isRecord(value) && isCommandZone(value.zone);
}

export function isWaterPointsResponse(
  value: unknown,
): value is { waterPoints: CommandWaterPoint[] } {
  return (
    isRecord(value) &&
    Array.isArray(value.waterPoints) &&
    value.waterPoints.every(isCommandWaterPoint)
  );
}

export function isWaterPointResponse(
  value: unknown,
): value is { waterPoint: CommandWaterPoint } {
  return isRecord(value) && isCommandWaterPoint(value.waterPoint);
}

export function isFirmsSyncStatus(value: unknown): value is FirmsSyncStatus {
  return (
    isRecord(value) &&
    typeof value.configured === "boolean" &&
    isNullableString(value.lastSuccessfulAt) &&
    isNullableString(value.lastAttemptAt) &&
    isNullableString(value.lastErrorCode) &&
    isNullableNumber(value.lastProcessedCount) &&
    typeof value.storedHotspotCount === "number"
  );
}

function isCommandZone(value: unknown): value is CommandZone {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.slug === "string" &&
    typeof value.name === "string" &&
    isNullableString(value.villageName) &&
    typeof value.peatDepthMeters === "number" &&
    typeof value.areaHectares === "number" &&
    typeof value.carbonFactor === "number" &&
    typeof value.emissionFactor === "number" &&
    typeof value.incentivePerTonIdr === "number" &&
    typeof value.isApproved === "boolean" &&
    typeof value.isDemoData === "boolean" &&
    isPolygon(value.geometry)
  );
}

function isCommandWaterPoint(value: unknown): value is CommandWaterPoint {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    isNullableString(value.zoneId) &&
    isNullableString(value.zoneName) &&
    typeof value.name === "string" &&
    (value.type === "SEKAT_KANAL" ||
      value.type === "EMBUNG" ||
      value.type === "SUMBER_AIR") &&
    typeof value.latitude === "number" &&
    typeof value.longitude === "number" &&
    typeof value.isDemoData === "boolean" &&
    typeof value.createdAt === "string" &&
    typeof value.updatedAt === "string"
  );
}

function isCommandHotspot(value: unknown): value is CommandHotspot {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    Array.isArray(value.coordinates) &&
    value.coordinates.length === 2 &&
    value.coordinates.every((coordinate) => typeof coordinate === "number") &&
    value.kind === "hotspot" &&
    typeof value.label === "string" &&
    typeof value.source === "string" &&
    typeof value.acquiredAt === "string" &&
    typeof value.fetchedAt === "string" &&
    isNullableString(value.confidence) &&
    isNullableNumber(value.brightnessKelvin) &&
    typeof value.isDemoData === "boolean"
  );
}

function isPolygon(value: unknown): value is CommandZone["geometry"] {
  if (
    !isRecord(value) ||
    value.type !== "Polygon" ||
    !Array.isArray(value.coordinates)
  ) {
    return false;
  }

  return value.coordinates.every(
    (ring) =>
      Array.isArray(ring) &&
      ring.every(
        (position) =>
          Array.isArray(position) &&
          position.length === 2 &&
          position.every((coordinate) => typeof coordinate === "number"),
      ),
  );
}

function isNullableString(value: unknown): value is string | null {
  return value === null || typeof value === "string";
}

function isNullableNumber(value: unknown): value is number | null {
  return value === null || typeof value === "number";
}
