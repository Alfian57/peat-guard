import "server-only";

import { Prisma } from "@/lib/generated/prisma/client";
import {
  DEMO_HOTSPOT_SOURCE,
  FIRMS_INGEST_SOURCES,
  FIRMS_SOURCES,
} from "@/lib/firms-sources";
import {
  calculateZoneImpact,
  summarizeZoneImpacts,
} from "@/lib/server/mrv/calculations";
import { getApprovedZoneValues } from "@/lib/server/mrv/data";
import { prisma } from "@/lib/prisma";
import type { Polygon } from "geojson";
import type { PublicMapData, PublicMetrics } from "@/lib/public/contracts";
import type { PublicMapQuery } from "@/lib/public/query";
import {
  PUBLIC_DEFAULT_VIEWPORT,
  MAX_PUBLIC_ZONE_LIMIT,
} from "@/lib/public/query";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";
import { getFirmsConfiguration } from "@/lib/server/firms/client";
import { getFirmsFreshnessStatus } from "@/lib/server/firms/status";
import { isRecord } from "@/lib/server/command/http";

type ZoneRow = {
  name: string;
  areaHectares: number;
  isDemoData: boolean;
  geometryJson: string;
};

type HotspotRow = {
  source: string;
  latitude: number;
  longitude: number;
  brightnessKelvin: number | null;
  confidence: string | null;
  acquiredAt: Date;
  isDemoData: boolean;
};

export function buildPublicZoneQuery(query: PublicMapQuery): Prisma.Sql {
  const { west, south, east, north } = query.viewport;
  const zoneLimit = Math.min(query.limit, MAX_PUBLIC_ZONE_LIMIT);

  return Prisma.sql`
    SELECT
      zone.zone_name AS name,
      zone.area_hectares::double precision AS "areaHectares",
      (zone.is_demo_data OR parameters.is_demo_data) AS "isDemoData",
      ST_AsGeoJSON(zone.boundary) AS "geometryJson"
    FROM forest_zones AS zone
    JOIN carbon_parameter_sets parameters ON parameters.id = zone.carbon_parameter_set_id
    WHERE zone.is_approved = TRUE AND zone.archived_at IS NULL
      AND ST_Intersects(
        zone.boundary,
        ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
      )
    ORDER BY zone.zone_name ASC
    LIMIT ${zoneLimit + 1}
  `;
}

export function buildPublicHotspotQuery(
  query: PublicMapQuery,
  checkedAt: Date,
): Prisma.Sql {
  const sourceFilter = buildSourceFilter(query);
  const confidenceFilter = buildConfidenceFilter(query.confidence);
  const periodFilter = buildPeriodFilter(query.period, checkedAt);
  const { west, south, east, north } = query.viewport;

  return Prisma.sql`
    SELECT
      hotspot.source,
      hotspot.latitude,
      hotspot.longitude,
      hotspot.brightness_kelvin::double precision AS "brightnessKelvin",
      hotspot.confidence,
      hotspot.acquired_at AS "acquiredAt",
      hotspot.is_demo_data AS "isDemoData"
    FROM satellite_hotspots AS hotspot
    WHERE ${sourceFilter}
      AND ${confidenceFilter}
      AND ${periodFilter}
      AND ST_Intersects(
        hotspot.location,
        ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326)
      )
    ORDER BY hotspot.acquired_at DESC
    LIMIT ${query.limit + 1}
  `;
}

function buildSourceFilter(query: PublicMapQuery): Prisma.Sql {
  if (query.source === "demo") {
    return Prisma.sql`
      hotspot.is_demo_data = TRUE
      AND hotspot.source = ${DEMO_HOTSPOT_SOURCE}
    `;
  }

  if (query.source !== "all") {
    return Prisma.sql`
      hotspot.is_demo_data = FALSE
      AND hotspot.source = ${query.source}
    `;
  }

  return Prisma.sql`
    (
      (hotspot.is_demo_data = TRUE AND hotspot.source = ${DEMO_HOTSPOT_SOURCE})
      OR (
        hotspot.is_demo_data = FALSE
        AND hotspot.source IN (${Prisma.join([...FIRMS_SOURCES])})
      )
    )
  `;
}

function buildConfidenceFilter(
  confidence: PublicMapQuery["confidence"],
): Prisma.Sql {
  if (confidence === "all") {
    return Prisma.sql`TRUE`;
  }

  if (confidence === "unknown") {
    return Prisma.sql`(hotspot.confidence IS NULL OR BTRIM(hotspot.confidence) = '')`;
  }

  if (confidence === "low") {
    return Prisma.sql`LOWER(hotspot.confidence) = 'low'`;
  }

  if (confidence === "nominal") {
    return Prisma.sql`LOWER(hotspot.confidence) = 'nominal'`;
  }

  if (confidence === "high") {
    return Prisma.sql`LOWER(hotspot.confidence) = 'high'`;
  }

  if (confidence === "numeric") {
    return Prisma.sql`
      CASE
        WHEN hotspot.confidence ~ '^[0-9]{1,3}$'
        THEN hotspot.confidence::integer BETWEEN 0 AND 100
        ELSE FALSE
      END
    `;
  }

  return Prisma.sql`FALSE`;
}

function buildPeriodFilter(
  period: PublicMapQuery["period"],
  checkedAt: Date,
): Prisma.Sql {
  if (period === "all") {
    return Prisma.sql`TRUE`;
  }

  const hoursByPeriod = {
    "24h": 24,
    "7d": 7 * 24,
    "30d": 30 * 24,
  } as const;
  const from = new Date(
    checkedAt.getTime() - hoursByPeriod[period] * 60 * 60_000,
  );

  return Prisma.sql`hotspot.acquired_at >= ${from}`;
}

export async function getPublicMapData(
  query: PublicMapQuery,
): Promise<PublicMapData> {
  const checkedAt = new Date();
  const [zoneRows, hotspotRows, lastSuccessfulSync, latestDataSync] =
    await Promise.all([
      prisma.$queryRaw<ZoneRow[]>(buildPublicZoneQuery(query)),
      prisma.$queryRaw<HotspotRow[]>(buildPublicHotspotQuery(query, checkedAt)),
      prisma.auditEvent.findFirst({
        where: {
          aggregateType: "NASA_FIRMS_SYNC",
          eventType: "FIRMS_SYNC_SUCCEEDED",
        },
        orderBy: { createdAt: "desc" },
        select: { createdAt: true },
      }),
      getLatestFirmsDataSync(),
    ]);
  const freshness = getPublicFreshness(
    checkedAt,
    latestDataSync,
    lastSuccessfulSync?.createdAt ?? null,
  );

  return {
    generatedAt: checkedAt.toISOString(),
    viewport: query.viewport,
    period: query.period,
    source: query.source,
    confidence: query.confidence,
    zones: zoneRows
      .slice(0, Math.min(query.limit, MAX_PUBLIC_ZONE_LIMIT))
      .map((row) => ({
        name: row.name,
        areaHectares: row.areaHectares,
        geometry: JSON.parse(row.geometryJson) as Polygon,
        isDemoData: row.isDemoData,
      })),
    hotspots: hotspotRows.slice(0, query.limit).map((row) => ({
      coordinates: [row.longitude, row.latitude],
      source: row.source as PublicMapData["hotspots"][number]["source"],
      confidence: row.confidence,
      brightnessKelvin: row.brightnessKelvin,
      acquiredAt: row.acquiredAt.toISOString(),
      isDemoData: row.isDemoData,
    })),
    truncated: {
      zones: zoneRows.length > Math.min(query.limit, MAX_PUBLIC_ZONE_LIMIT),
      hotspots: hotspotRows.length > query.limit,
    },
    freshness,
  };
}

function getLatestFirmsDataSync() {
  return prisma.auditEvent.findFirst({
    where: {
      aggregateType: "NASA_FIRMS_SYNC",
      eventType: { in: ["FIRMS_SYNC_SUCCEEDED", "FIRMS_SYNC_PARTIAL"] },
    },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true, eventType: true, payload: true },
  });
}

function getPublicFreshness(
  checkedAt: Date,
  latestDataSync: Awaited<ReturnType<typeof getLatestFirmsDataSync>>,
  lastSuccessfulAt: Date | null = null,
): PublicMapData["freshness"] {
  let expectedIntervalMinutes: number | null = null;
  let configurationValid = true;
  try {
    expectedIntervalMinutes = getFirmsSyncIntervalMinutes();
    getFirmsConfiguration();
  } catch {
    configurationValid = false;
  }
  const configured = Boolean(process.env.NASA_FIRMS_MAP_KEY?.trim());
  const lastDataSyncAt = latestDataSync?.createdAt ?? null;
  const lastDataOutcome = latestDataSync
    ? latestDataSync.eventType === "FIRMS_SYNC_PARTIAL"
      ? "partial"
      : "success"
    : null;

  return {
    provider: "NASA FIRMS",
    configured,
    checkedAt: checkedAt.toISOString(),
    lastSuccessfulAt: lastSuccessfulAt?.toISOString() ?? null,
    lastDataSyncAt: lastDataSyncAt?.toISOString() ?? null,
    failedSources: readFailedSources(latestDataSync?.payload),
    expectedIntervalMinutes,
    status: getFirmsFreshnessStatus({
      configured,
      configurationValid,
      checkedAt,
      expectedIntervalMinutes,
      lastDataSyncAt,
      lastDataOutcome,
    }),
  };
}

function readFailedSources(
  value: unknown,
): PublicMapData["freshness"]["failedSources"] {
  if (!isRecord(value) || !Array.isArray(value.failedSources)) return [];
  return value.failedSources.flatMap((item) => {
    if (
      isRecord(item) &&
      typeof item.source === "string" &&
      FIRMS_INGEST_SOURCES.includes(
        item.source as (typeof FIRMS_INGEST_SOURCES)[number],
      )
    ) {
      return [item.source as (typeof FIRMS_INGEST_SOURCES)[number]];
    }
    return [];
  });
}

async function getApprovedZoneMetrics(): Promise<PublicMetrics> {
  const periodDays = 7;
  const { west, south, east, north } = PUBLIC_DEFAULT_VIEWPORT;
  const now = new Date();
  const since = new Date(now.getTime() - periodDays * 86400_000);
  const [
    zones,
    hotspotCount,
    illustrativeHotspotCount,
    [firms],
    latestDataSync,
  ] = await Promise.all([
    getApprovedZoneValues(),
    prisma.satelliteHotspot.count({ where: publicHotspotWhere }),
    prisma.satelliteHotspot.count({
      where: { ...publicHotspotWhere, isDemoData: true },
    }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM satellite_hotspots
      WHERE NOT is_demo_data AND source IN (${Prisma.join([...FIRMS_SOURCES])})
        AND acquired_at >= ${since} AND acquired_at <= ${now}
        AND ST_Intersects(location, ST_MakeEnvelope(${west}, ${south}, ${east}, ${north}, 4326))
    `,
    getLatestFirmsDataSync(),
  ]);
  const included = zones
    .filter((zone) => !zone.overlapsApprovedZone)
    .map(calculateZoneImpact);
  const illustrativeZoneCount = zones.filter(
    (zone) => zone.isDemoData || zone.parameterIsDemoData,
  ).length;
  return {
    approvedZoneCount: zones.length,
    ...summarizeZoneImpacts(included),
    hotspotCount,
    containsIllustrativeData:
      illustrativeZoneCount > 0 || illustrativeHotspotCount > 0,
    illustrativeZoneCount,
    excludedZoneCount: zones.length - included.length,
    firmsHotspotCount: firms.count,
    firmsFreshness: getPublicFreshness(now, latestDataSync).status,
    hotspotPeriodDays: periodDays,
  };
}

const publicHotspotWhere: Prisma.SatelliteHotspotWhereInput = {
  OR: [
    { isDemoData: true, source: DEMO_HOTSPOT_SOURCE },
    { isDemoData: false, source: { in: [...FIRMS_SOURCES] } },
  ],
};

export async function getPublicMetrics(): Promise<PublicMetrics> {
  return getApprovedZoneMetrics();
}
