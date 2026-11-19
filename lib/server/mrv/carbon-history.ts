import "server-only";

import { prisma } from "@/lib/prisma";
import { summarizeZoneImpacts, calculateZoneImpact } from "./calculations";
import type {
  CarbonSnapshotReason,
  CarbonSnapshotZoneValues,
  MrvDataset,
} from "./contracts";

type SnapshotRow = Omit<CarbonSnapshotZoneValues, "snapshotAt"> & {
  asOf: Date;
  snapshotAt: Date;
  isZoneApproved: boolean;
  hasBoundary: boolean;
  overlaps: boolean;
  snapshotReason: CarbonSnapshotReason;
};

export async function getCarbonHistory(
  dates: Date[],
  zoneId: string | null = null,
  dataset?: MrvDataset,
) {
  const illustrative = dataset ? dataset === "simulation" : null;
  const rows = await prisma.$queryRaw<SnapshotRow[]>`
    WITH snapshots AS MATERIALIZED (
      SELECT period.cutoff, snapshot.*
      FROM (SELECT DISTINCT cutoff FROM unnest(${dates}::timestamptz[]) AS period(cutoff)) AS period
      CROSS JOIN forest_zones AS zone
      CROSS JOIN LATERAL (
        SELECT * FROM forest_zone_carbon_snapshots snapshot
        WHERE snapshot.zone_id = zone.id AND snapshot.captured_at <= period.cutoff
        ORDER BY snapshot.captured_at DESC, snapshot.id DESC LIMIT 1
      ) AS snapshot
    )
    SELECT item.cutoff AS "asOf", item.zone_id::text AS "zoneId", item.zone_name AS "zoneName",
      village_name AS "villageName", area_hectares::float8 AS "areaHectares",
      carbon_parameter_set_id::text AS "parameterSetId", parameter_set_name AS name,
      (SELECT source FROM carbon_parameter_sets WHERE id = item.carbon_parameter_set_id) AS "parameterSource",
      biomass_factor::float8 AS "biomassFactor", emission_factor::float8 AS "emissionFactor",
      co2_conversion_factor::float8 AS "co2ConversionFactor", incentive_per_ton_idr::float8 AS "incentivePerTonIdr",
      is_zone_demo_data AS "isDemoData", is_parameter_demo_data AS "parameterIsDemoData",
      is_zone_approved AS "isZoneApproved", reason::text AS "snapshotReason", captured_at AS "snapshotAt",
      boundary IS NOT NULL AS "hasBoundary",
      EXISTS (
        SELECT 1 FROM snapshots other
        WHERE other.cutoff = item.cutoff AND other.zone_id <> item.zone_id AND other.is_zone_approved
          AND (other.is_zone_demo_data OR other.is_parameter_demo_data) = (item.is_zone_demo_data OR item.is_parameter_demo_data)
          AND other.boundary && item.boundary AND ST_Relate(other.boundary, item.boundary, '2********')
      ) AS overlaps
    FROM snapshots item
    WHERE (${zoneId}::uuid IS NULL OR item.zone_id = ${zoneId}::uuid)
      AND (${illustrative}::boolean IS NULL OR (item.is_zone_demo_data OR item.is_parameter_demo_data) = ${illustrative})
    ORDER BY cutoff, zone_name, zone_id
  `;
  const byDate = new Map<number, SnapshotRow[]>();
  for (const row of rows) {
    const timestamp = row.asOf.getTime();
    const entries = byDate.get(timestamp) ?? [];
    entries.push(row);
    byDate.set(timestamp, entries);
  }
  return dates.map((date) => {
    const snapshots = byDate.get(date.getTime()) ?? [];
    const approved = snapshots.filter((row) => row.isZoneApproved);
    const zones: CarbonSnapshotZoneValues[] = approved
      .filter((row) => !row.overlaps)
      .map((row) => ({
        areaHectares: row.areaHectares,
        biomassFactor: row.biomassFactor,
        co2ConversionFactor: row.co2ConversionFactor,
        emissionFactor: row.emissionFactor,
        incentivePerTonIdr: row.incentivePerTonIdr,
        isDemoData: row.isDemoData,
        name: row.name,
        parameterIsDemoData: row.parameterIsDemoData,
        parameterSetId: row.parameterSetId,
        parameterSource: row.parameterSource,
        villageName: row.villageName,
        snapshotAt: row.snapshotAt.toISOString(),
        snapshotReason: row.snapshotReason,
        zoneId: row.zoneId,
        zoneName: row.zoneName,
      }));
    return {
      hasSnapshot:
        snapshots.length > 0 && approved.every((row) => row.hasBoundary),
      excludedCount: approved.filter((row) => row.overlaps).length,
      zones,
      totals: summarizeZoneImpacts(zones.map(calculateZoneImpact)),
    };
  });
}
