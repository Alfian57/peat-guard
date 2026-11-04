import "server-only";

import { Prisma } from "@/app/generated/prisma/client";
import { DEMO_HOTSPOT_SOURCE, FIRMS_SOURCES } from "@/lib/firms-sources";
import { prisma } from "@/lib/prisma";
import type { Polygon } from "geojson";
import type { PublicMapData, PublicMetrics } from "@/lib/public/contracts";
import type { PublicMapQuery } from "@/lib/public/query";
import { MAX_PUBLIC_ZONE_LIMIT } from "@/lib/public/query";
import { getFirmsSyncIntervalMinutes } from "@/lib/server/firms/config";

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

type MetricsRow = {
  approvedZoneCount: number;
  protectedAreaHectares: number;
  estimatedCarbonTons: number;
  estimatedIncentiveIdr: number;
  containsIllustrativeData: boolean;
};

export function buildPublicZoneQuery(query: PublicMapQuery): Prisma.Sql {
  const { west, south, east, north } = query.viewport;
  const zoneLimit = Math.min(query.limit, MAX_PUBLIC_ZONE_LIMIT);

  return Prisma.sql`
    SELECT
      zone.zone_name AS name,
      zone.area_hectares::double precision AS "areaHectares",
      zone.is_demo_data AS "isDemoData",
      ST_AsGeoJSON(zone.boundary) AS "geometryJson"
    FROM forest_zones AS zone
    WHERE zone.is_approved = TRUE
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
  const [zoneRows, hotspotRows, lastSuccessfulSync] = await Promise.all([
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
  ]);
  const expectedIntervalMinutes = getFirmsSyncIntervalMinutes();
  const freshness = getPublicFreshness({
    configured: Boolean(process.env.NASA_FIRMS_MAP_KEY?.trim()),
    checkedAt,
    expectedIntervalMinutes,
    lastSuccessfulAt: lastSuccessfulSync?.createdAt ?? null,
  });

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

function getPublicFreshness(args: {
  configured: boolean;
  checkedAt: Date;
  expectedIntervalMinutes: number;
  lastSuccessfulAt: Date | null;
}): PublicMapData["freshness"] {
  const { configured, checkedAt, expectedIntervalMinutes, lastSuccessfulAt } =
    args;
  const staleAfterMs = (expectedIntervalMinutes + 5) * 60_000;
  const isStale =
    lastSuccessfulAt !== null &&
    checkedAt.getTime() - lastSuccessfulAt.getTime() > staleAfterMs;

  return {
    provider: "NASA FIRMS",
    configured,
    checkedAt: checkedAt.toISOString(),
    lastSuccessfulAt: lastSuccessfulAt?.toISOString() ?? null,
    expectedIntervalMinutes,
    status: !configured
      ? "not_configured"
      : lastSuccessfulAt === null
        ? "unavailable"
        : isStale
          ? "stale"
          : "fresh",
  };
}

async function getApprovedZoneMetrics(): Promise<PublicMetrics> {
  const [rows, hotspotCount, illustrativeHotspotCount] = await Promise.all([
    prisma.$queryRaw<MetricsRow[]>`
      SELECT
        COUNT(zone.id)::integer AS "approvedZoneCount",
        COALESCE(SUM(zone.area_hectares), 0)::double precision AS "protectedAreaHectares",
        COALESCE(
          SUM(
            zone.area_hectares
            * parameters.biomass_factor
            * parameters.emission_factor
            * parameters.co2_conversion_factor
          ),
          0
        )::double precision AS "estimatedCarbonTons",
        COALESCE(
          SUM(
            zone.area_hectares
            * parameters.biomass_factor
            * parameters.emission_factor
            * parameters.co2_conversion_factor
            * parameters.incentive_per_ton_idr
          ),
          0
        )::double precision AS "estimatedIncentiveIdr",
        COALESCE(BOOL_OR(zone.is_demo_data OR parameters.is_demo_data), FALSE)
          AS "containsIllustrativeData"
      FROM forest_zones AS zone
      INNER JOIN carbon_parameter_sets AS parameters
        ON parameters.id = zone.carbon_parameter_set_id
      WHERE zone.is_approved = TRUE
    `,
    prisma.satelliteHotspot.count({ where: publicHotspotWhere }),
    prisma.satelliteHotspot.count({
      where: { ...publicHotspotWhere, isDemoData: true },
    }),
  ]);

  const row = rows[0];

  return {
    approvedZoneCount: row?.approvedZoneCount ?? 0,
    protectedAreaHectares: row?.protectedAreaHectares ?? 0,
    estimatedCarbonTons: row?.estimatedCarbonTons ?? 0,
    estimatedIncentiveIdr: row?.estimatedIncentiveIdr ?? 0,
    hotspotCount,
    containsIllustrativeData:
      (row?.containsIllustrativeData ?? false) || illustrativeHotspotCount > 0,
  };
}

const publicHotspotWhere = {
  OR: [
    { isDemoData: true, source: DEMO_HOTSPOT_SOURCE },
    { isDemoData: false, source: { in: [...FIRMS_SOURCES] } },
  ],
} as const;

export async function getPublicMetrics(): Promise<PublicMetrics> {
  return getApprovedZoneMetrics();
}
