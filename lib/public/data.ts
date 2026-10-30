import "server-only";

import { prisma } from "@/lib/prisma";
import type { MapPoint, MapZone } from "@/lib/maps/types";
import type { PublicMapData, PublicMetrics } from "@/lib/public/contracts";

type ZoneRow = {
  id: string;
  name: string;
  areaHectares: number;
  isDemoData: boolean;
  geometryJson: string;
};

type MetricsRow = {
  approvedZoneCount: number;
  protectedAreaHectares: number;
  estimatedCarbonTons: number;
  estimatedIncentiveIdr: number;
  containsIllustrativeData: boolean;
};

async function getApprovedZones(): Promise<MapZone[]> {
  const rows = await prisma.$queryRaw<ZoneRow[]>`
    SELECT
      id::text AS id,
      zone_name AS name,
      area_hectares::double precision AS "areaHectares",
      is_demo_data AS "isDemoData",
      ST_AsGeoJSON(boundary) AS "geometryJson"
    FROM forest_zones
    WHERE is_approved = TRUE
    ORDER BY zone_name ASC
    LIMIT 100
  `;

  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    areaHectares: row.areaHectares,
    isDemoData: row.isDemoData,
    geometry: JSON.parse(row.geometryJson) as MapZone["geometry"],
  }));
}

async function getPublicHotspots(): Promise<MapPoint[]> {
  const hotspots = await prisma.satelliteHotspot.findMany({
    orderBy: { acquiredAt: "desc" },
    take: 500,
    select: {
      id: true,
      source: true,
      latitude: true,
      longitude: true,
      brightnessKelvin: true,
      confidence: true,
      acquiredAt: true,
      isDemoData: true,
    },
  });

  return hotspots.map((hotspot) => ({
    id: hotspot.id,
    coordinates: [hotspot.longitude, hotspot.latitude],
    kind: "hotspot",
    label: hotspot.isDemoData ? "Titik panas contoh" : "NASA FIRMS hotspot",
    description: [
      hotspot.isDemoData ? "Ilustrasi sintetis" : "NASA FIRMS",
      hotspot.confidence ? `Keyakinan ${hotspot.confidence}` : null,
      hotspot.brightnessKelvin ? `${Number(hotspot.brightnessKelvin)} K` : null,
      hotspot.acquiredAt.toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
        timeZone: "Asia/Jakarta",
      }),
    ]
      .filter(Boolean)
      .join(" · "),
    source: hotspot.source,
    isDemoData: hotspot.isDemoData,
  }));
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
    prisma.satelliteHotspot.count(),
    prisma.satelliteHotspot.count({ where: { isDemoData: true } }),
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

export async function getPublicMapData(): Promise<PublicMapData> {
  const [zones, hotspots] = await Promise.all([
    getApprovedZones(),
    getPublicHotspots(),
  ]);

  return { zones, hotspots };
}

export async function getPublicMetrics(): Promise<PublicMetrics> {
  return getApprovedZoneMetrics();
}
