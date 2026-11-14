import {
  DEMO_HOTSPOT_SOURCE,
  FIRMS_INGEST_SOURCES,
  FIRMS_SOURCES,
} from "@/lib/firms-sources";
import {
  PUBLIC_MAP_CONFIDENCE_FILTERS,
  PUBLIC_MAP_PERIODS,
  PUBLIC_MAP_SOURCES,
} from "@/lib/public/contracts";
import { hotspotConfidenceLabel, hotspotSourceLabel } from "@/lib/firms-labels";
import type { MapPoint, MapZone, MapViewport } from "@/lib/maps/types";
import type { PublicMapData, PublicMetrics } from "@/lib/public/contracts";

export type PublicMapViewData = Omit<PublicMapData, "zones" | "hotspots"> & {
  zones: MapZone[];
  hotspots: MapPoint[];
};

const FRESHNESS_STATUSES = [
  "fresh",
  "partial",
  "stale",
  "unavailable",
  "not_configured",
  "configuration_error",
] as const;

export function parsePublicMapData(value: unknown): PublicMapViewData {
  const data = asRecord(value);
  assertExactKeys(data, [
    "generatedAt",
    "viewport",
    "period",
    "source",
    "confidence",
    "zones",
    "hotspots",
    "truncated",
    "freshness",
  ]);
  const viewport = parseViewport(data.viewport);
  const period = parseEnum(data.period, PUBLIC_MAP_PERIODS);
  const source = parseEnum(data.source, PUBLIC_MAP_SOURCES);
  const confidence = parseEnum(data.confidence, PUBLIC_MAP_CONFIDENCE_FILTERS);
  const freshness = parseFreshness(data.freshness);
  const truncated = asRecord(data.truncated);
  assertExactKeys(truncated, ["zones", "hotspots"]);

  if (
    typeof truncated.zones !== "boolean" ||
    typeof truncated.hotspots !== "boolean"
  ) {
    throw new Error("Invalid public map response.");
  }

  if (!Array.isArray(data.zones) || !Array.isArray(data.hotspots)) {
    throw new Error("Invalid public map response.");
  }

  return {
    generatedAt: parseIsoTimestamp(data.generatedAt),
    viewport,
    period,
    source,
    confidence,
    zones: data.zones.map(parseZone),
    hotspots: data.hotspots.map(parseHotspot),
    truncated: { zones: truncated.zones, hotspots: truncated.hotspots },
    freshness,
  };
}

export function parsePublicMetrics(value: unknown): PublicMetrics {
  const metrics = asRecord(value);
  assertExactKeys(metrics, [
    "approvedZoneCount",
    "protectedAreaHectares",
    "estimatedCarbonTons",
    "estimatedIncentiveIdr",
    "hotspotCount",
    "containsIllustrativeData",
  ]);

  const {
    approvedZoneCount,
    protectedAreaHectares,
    estimatedCarbonTons,
    estimatedIncentiveIdr,
    hotspotCount,
    containsIllustrativeData,
  } = metrics;

  if (
    !isNonNegativeFiniteNumber(approvedZoneCount) ||
    !isNonNegativeFiniteNumber(protectedAreaHectares) ||
    !isNonNegativeFiniteNumber(estimatedCarbonTons) ||
    !isNonNegativeFiniteNumber(estimatedIncentiveIdr) ||
    !isNonNegativeFiniteNumber(hotspotCount) ||
    typeof containsIllustrativeData !== "boolean"
  ) {
    throw new Error("Invalid public metrics response.");
  }

  return {
    approvedZoneCount,
    protectedAreaHectares,
    estimatedCarbonTons,
    estimatedIncentiveIdr,
    hotspotCount,
    containsIllustrativeData,
  };
}

function parseZone(value: unknown, index: number): MapZone {
  const zone = asRecord(value);
  assertExactKeys(zone, ["name", "areaHectares", "geometry", "isDemoData"]);

  if (
    typeof zone.name !== "string" ||
    zone.name.trim() === "" ||
    zone.name.length > 150 ||
    !isNonNegativeFiniteNumber(zone.areaHectares) ||
    typeof zone.isDemoData !== "boolean" ||
    !isPolygon(zone.geometry)
  ) {
    throw new Error("Invalid public map response.");
  }

  return {
    id: `public-zone-${index}`,
    name: zone.name,
    areaHectares: zone.areaHectares,
    geometry: zone.geometry,
    isDemoData: zone.isDemoData,
  };
}

function parseHotspot(value: unknown, index: number): MapPoint {
  const hotspot = asRecord(value);
  assertExactKeys(hotspot, [
    "coordinates",
    "source",
    "confidence",
    "brightnessKelvin",
    "acquiredAt",
    "isDemoData",
  ]);
  const coordinates = parseCoordinates(hotspot.coordinates);
  const source = parseHotspotSource(hotspot.source);
  const isDemoData = hotspot.isDemoData;

  if (
    typeof isDemoData !== "boolean" ||
    (source === DEMO_HOTSPOT_SOURCE) !== isDemoData ||
    (hotspot.confidence !== null &&
      (typeof hotspot.confidence !== "string" ||
        hotspot.confidence.length > 20)) ||
    (hotspot.brightnessKelvin !== null &&
      !isNonNegativeFiniteNumber(hotspot.brightnessKelvin))
  ) {
    throw new Error("Invalid public map response.");
  }

  const acquiredAt = parseIsoTimestamp(hotspot.acquiredAt);
  const confidence = hotspot.confidence as string | null;
  const brightnessKelvin = hotspot.brightnessKelvin as number | null;
  const displaySource = hotspotSourceLabel(source);
  const description = [
    displaySource,
    `Keyakinan deteksi ${hotspotConfidenceLabel(confidence)}`,
    brightnessKelvin === null ? null : `${brightnessKelvin} K`,
    new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(acquiredAt)),
  ]
    .filter(Boolean)
    .join(" · ");

  return {
    id: `public-hotspot-${index}`,
    coordinates,
    kind: "hotspot",
    label: isDemoData ? "Titik panas contoh" : "Hotspot NASA FIRMS",
    description,
    source,
    isDemoData,
  };
}

function parseFreshness(value: unknown): PublicMapData["freshness"] {
  const freshness = asRecord(value);
  assertExactKeys(freshness, [
    "provider",
    "status",
    "configured",
    "checkedAt",
    "lastSuccessfulAt",
    "lastDataSyncAt",
    "failedSources",
    "expectedIntervalMinutes",
  ]);

  if (
    freshness.provider !== "NASA FIRMS" ||
    typeof freshness.configured !== "boolean" ||
    !FRESHNESS_STATUSES.includes(
      freshness.status as (typeof FRESHNESS_STATUSES)[number],
    ) ||
    (freshness.expectedIntervalMinutes !== null &&
      (!Number.isInteger(freshness.expectedIntervalMinutes) ||
        (freshness.expectedIntervalMinutes as number) < 5 ||
        (freshness.expectedIntervalMinutes as number) > 1_440)) ||
    (freshness.lastSuccessfulAt !== null &&
      !isIsoTimestamp(freshness.lastSuccessfulAt)) ||
    (freshness.lastDataSyncAt !== null &&
      !isIsoTimestamp(freshness.lastDataSyncAt)) ||
    !Array.isArray(freshness.failedSources) ||
    !freshness.failedSources.every((source) =>
      (FIRMS_INGEST_SOURCES as readonly unknown[]).includes(source),
    )
  ) {
    throw new Error("Invalid public map response.");
  }

  return {
    provider: "NASA FIRMS",
    status: freshness.status as PublicMapData["freshness"]["status"],
    configured: freshness.configured,
    checkedAt: parseIsoTimestamp(freshness.checkedAt),
    lastSuccessfulAt:
      freshness.lastSuccessfulAt === null
        ? null
        : parseIsoTimestamp(freshness.lastSuccessfulAt),
    lastDataSyncAt:
      freshness.lastDataSyncAt === null
        ? null
        : parseIsoTimestamp(freshness.lastDataSyncAt),
    failedSources:
      freshness.failedSources as PublicMapData["freshness"]["failedSources"],
    expectedIntervalMinutes:
      freshness.expectedIntervalMinutes === null
        ? null
        : (freshness.expectedIntervalMinutes as number),
  };
}

function parseViewport(value: unknown): MapViewport {
  const viewport = asRecord(value);
  assertExactKeys(viewport, ["west", "south", "east", "north"]);

  const { west, south, east, north } = viewport;

  if (
    ![west, south, east, north].every(isFiniteNumber) ||
    (west as number) < -180 ||
    (east as number) > 180 ||
    (south as number) < -90 ||
    (north as number) > 90 ||
    (west as number) >= (east as number) ||
    (south as number) >= (north as number) ||
    (east as number) - (west as number) > 20 ||
    (north as number) - (south as number) > 15
  ) {
    throw new Error("Invalid public map response.");
  }

  return { west, south, east, north } as MapViewport;
}

function parseCoordinates(value: unknown): [number, number] {
  if (
    !Array.isArray(value) ||
    value.length !== 2 ||
    !isFiniteNumber(value[0]) ||
    !isFiniteNumber(value[1]) ||
    value[0] < -180 ||
    value[0] > 180 ||
    value[1] < -90 ||
    value[1] > 90
  ) {
    throw new Error("Invalid public map response.");
  }

  return [value[0], value[1]];
}

function isPolygon(value: unknown): value is MapZone["geometry"] {
  const geometry = asRecord(value);

  if (geometry.type !== "Polygon" || !Array.isArray(geometry.coordinates)) {
    return false;
  }

  if (geometry.coordinates.length === 0) {
    return false;
  }

  return geometry.coordinates.every((ring: unknown) => {
    if (!Array.isArray(ring) || ring.length < 4) {
      return false;
    }

    const validPositions = ring.every(
      (position: unknown) =>
        Array.isArray(position) &&
        position.length === 2 &&
        isFiniteNumber(position[0]) &&
        isFiniteNumber(position[1]) &&
        position[0] >= -180 &&
        position[0] <= 180 &&
        position[1] >= -90 &&
        position[1] <= 90,
    );

    if (!validPositions) {
      return false;
    }

    const first = ring[0] as number[];
    const last = ring.at(-1) as number[];
    return first[0] === last[0] && first[1] === last[1];
  });
}

function parseHotspotSource(
  value: unknown,
): PublicMapData["hotspots"][number]["source"] {
  if (
    typeof value === "string" &&
    (value === DEMO_HOTSPOT_SOURCE ||
      (FIRMS_SOURCES as readonly string[]).includes(value))
  ) {
    return value as PublicMapData["hotspots"][number]["source"];
  }

  throw new Error("Invalid public map response.");
}

function parseEnum<const T extends readonly string[]>(
  value: unknown,
  options: T,
): T[number] {
  if (typeof value === "string" && options.includes(value)) {
    return value as T[number];
  }

  throw new Error("Invalid public map response.");
}

function parseIsoTimestamp(value: unknown): string {
  if (!isIsoTimestamp(value)) {
    throw new Error("Invalid public map response.");
  }

  return value;
}

function isIsoTimestamp(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value) &&
    Number.isFinite(Date.parse(value))
  );
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

function isNonNegativeFiniteNumber(value: unknown): value is number {
  return isFiniteNumber(value) && value >= 0;
}

function asRecord(value: unknown): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error("Invalid public map response.");
  }

  return value as Record<string, unknown>;
}

function assertExactKeys(
  value: Record<string, unknown>,
  expected: readonly string[],
) {
  if (
    Object.keys(value).length !== expected.length ||
    expected.some((key) => !Object.hasOwn(value, key))
  ) {
    throw new Error("Invalid public map response.");
  }
}
