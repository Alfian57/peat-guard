import "server-only";

import { prisma } from "@/lib/prisma";
import type {
  CarbonSnapshotReason,
  CarbonSnapshotZoneValues,
  MrvReportFilters,
} from "@/lib/server/mrv/contracts";

export type ReportAggregateRow = {
  activeCount: number;
  aiTriagedCount: number;
  closedCount: number;
  demoActiveCount: number;
  demoAiTriagedCount: number;
  demoClosedCount: number;
  demoCount: number;
  demoRespondedCount: number;
  demoResponseMinutes: number | null;
  nonDemoActiveCount: number;
  nonDemoAiTriagedCount: number;
  nonDemoClosedCount: number;
  nonDemoCount: number;
  nonDemoRespondedCount: number;
  nonDemoResponseMinutes: number | null;
  respondedCount: number;
  responseMinutes: number | null;
  totalCount: number;
};

export type HotspotAggregateRow = {
  demoCount: number;
  nonDemoCount: number;
  totalCount: number;
};

export type MrvReportSource = {
  carbonSnapshotAsOf: string;
  hasCarbonSnapshot: boolean;
  hotspots: HotspotAggregateRow;
  reports: ReportAggregateRow;
  zones: CarbonSnapshotZoneValues[];
};

type CarbonSnapshotRow = {
  areaHectares: number;
  biomassFactor: number;
  co2ConversionFactor: number;
  emissionFactor: number;
  incentivePerTonIdr: number;
  isDemoData: boolean;
  isParameterDemoData: boolean;
  isZoneApproved: boolean;
  name: string;
  parameterSetId: string;
  snapshotAt: Date;
  snapshotReason: CarbonSnapshotReason;
  villageName: string | null;
  zoneId: string;
  zoneName: string;
};

function reportRangeBounds(filters: MrvReportFilters) {
  return {
    from: filters.range?.from ?? null,
    toExclusive: filters.range?.toExclusive ?? null,
  };
}

function snapshotAsOf(filters: MrvReportFilters, now: Date): Date {
  const toExclusive = filters.range?.toExclusive;
  return toExclusive ? new Date(toExclusive.getTime() - 1) : now;
}

async function getCarbonSnapshots(
  filters: MrvReportFilters,
  currentTime: Date,
): Promise<CarbonSnapshotRow[]> {
  const toExclusive = filters.range?.toExclusive ?? null;
  const zoneId = filters.zoneId;

  return prisma.$queryRaw<CarbonSnapshotRow[]>`
    SELECT DISTINCT ON (snapshot.zone_id)
      snapshot.zone_id::text AS "zoneId",
      snapshot.zone_name AS "zoneName",
      snapshot.village_name AS "villageName",
      snapshot.area_hectares::double precision AS "areaHectares",
      snapshot.carbon_parameter_set_id::text AS "parameterSetId",
      snapshot.parameter_set_name AS name,
      snapshot.biomass_factor::double precision AS "biomassFactor",
      snapshot.emission_factor::double precision AS "emissionFactor",
      snapshot.co2_conversion_factor::double precision AS "co2ConversionFactor",
      snapshot.incentive_per_ton_idr::double precision AS "incentivePerTonIdr",
      snapshot.is_zone_demo_data AS "isDemoData",
      snapshot.is_parameter_demo_data AS "isParameterDemoData",
      snapshot.is_zone_approved AS "isZoneApproved",
      snapshot.reason::text AS "snapshotReason",
      snapshot.captured_at AS "snapshotAt"
    FROM forest_zone_carbon_snapshots AS snapshot
    WHERE (
      (${toExclusive}::timestamptz IS NULL AND snapshot.captured_at <= ${currentTime}) OR
      (${toExclusive}::timestamptz IS NOT NULL AND snapshot.captured_at < ${toExclusive})
    )
      AND (${zoneId}::uuid IS NULL OR snapshot.zone_id = ${zoneId}::uuid)
    ORDER BY snapshot.zone_id, snapshot.captured_at DESC, snapshot.id DESC
  `;
}

async function getReportAggregate(
  filters: MrvReportFilters,
): Promise<ReportAggregateRow> {
  const { from, toExclusive } = reportRangeBounds(filters);
  const zoneId = filters.zoneId;
  const rows = await prisma.$queryRaw<ReportAggregateRow[]>`
    WITH filtered_reports AS (
      SELECT
        report.id,
        report.created_at,
        report.handling_status::text AS handling_status,
        report.ai_state::text AS ai_state,
        report.is_demo_sample
      FROM field_reports AS report
      WHERE (${from}::timestamptz IS NULL OR report.captured_at >= ${from})
        AND (
          ${toExclusive}::timestamptz IS NULL OR
          report.captured_at < ${toExclusive}
        )
        AND (${zoneId}::uuid IS NULL OR report.zone_id = ${zoneId}::uuid)
    ),
    first_responses AS (
      SELECT
        event.report_id,
        MIN(event.created_at) AS first_response_at
      FROM report_status_events AS event
      INNER JOIN filtered_reports AS report ON report.id = event.report_id
      WHERE event.next_status = 'DALAM_PENANGANAN'
      GROUP BY event.report_id
    )
    SELECT
      COUNT(report.id)::integer AS "totalCount",
      COUNT(report.id) FILTER (WHERE report.is_demo_sample = TRUE)::integer
        AS "demoCount",
      COUNT(report.id) FILTER (WHERE report.is_demo_sample = FALSE)::integer
        AS "nonDemoCount",
      COUNT(report.id) FILTER (WHERE report.ai_state = 'COMPLETED')::integer
        AS "aiTriagedCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = TRUE AND report.ai_state = 'COMPLETED'
      )::integer AS "demoAiTriagedCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = FALSE AND report.ai_state = 'COMPLETED'
      )::integer AS "nonDemoAiTriagedCount",
      COUNT(report.id) FILTER (
        WHERE report.handling_status <> 'SELESAI'
      )::integer AS "activeCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = TRUE AND report.handling_status <> 'SELESAI'
      )::integer AS "demoActiveCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = FALSE AND report.handling_status <> 'SELESAI'
      )::integer AS "nonDemoActiveCount",
      COUNT(report.id) FILTER (
        WHERE report.handling_status = 'SELESAI'
      )::integer AS "closedCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = TRUE AND report.handling_status = 'SELESAI'
      )::integer AS "demoClosedCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = FALSE AND report.handling_status = 'SELESAI'
      )::integer AS "nonDemoClosedCount",
      COUNT(response.report_id)::integer AS "respondedCount",
      COUNT(response.report_id) FILTER (
        WHERE report.is_demo_sample = TRUE
      )::integer AS "demoRespondedCount",
      COUNT(response.report_id) FILTER (
        WHERE report.is_demo_sample = FALSE
      )::integer AS "nonDemoRespondedCount",
      (AVG(GREATEST(
        EXTRACT(EPOCH FROM (response.first_response_at - report.created_at)) / 60,
        0
      )))::double precision AS "responseMinutes",
      (AVG(GREATEST(
        EXTRACT(EPOCH FROM (response.first_response_at - report.created_at)) / 60,
        0
      )) FILTER (WHERE report.is_demo_sample = TRUE))::double precision
        AS "demoResponseMinutes",
      (AVG(GREATEST(
        EXTRACT(EPOCH FROM (response.first_response_at - report.created_at)) / 60,
        0
      )) FILTER (WHERE report.is_demo_sample = FALSE))::double precision
        AS "nonDemoResponseMinutes"
    FROM filtered_reports AS report
    LEFT JOIN first_responses AS response ON response.report_id = report.id
  `;

  return (
    rows[0] ?? {
      activeCount: 0,
      aiTriagedCount: 0,
      closedCount: 0,
      demoActiveCount: 0,
      demoAiTriagedCount: 0,
      demoClosedCount: 0,
      demoCount: 0,
      demoRespondedCount: 0,
      demoResponseMinutes: null,
      nonDemoActiveCount: 0,
      nonDemoAiTriagedCount: 0,
      nonDemoClosedCount: 0,
      nonDemoCount: 0,
      nonDemoRespondedCount: 0,
      nonDemoResponseMinutes: null,
      respondedCount: 0,
      responseMinutes: null,
      totalCount: 0,
    }
  );
}

async function getHotspotAggregate(
  filters: MrvReportFilters,
): Promise<HotspotAggregateRow> {
  const { from, toExclusive } = reportRangeBounds(filters);
  const zoneId = filters.zoneId;
  const rows = await prisma.$queryRaw<HotspotAggregateRow[]>`
    SELECT
      COUNT(hotspot.id)::integer AS "totalCount",
      COUNT(hotspot.id) FILTER (WHERE hotspot.is_demo_data = TRUE)::integer
        AS "demoCount",
      COUNT(hotspot.id) FILTER (WHERE hotspot.is_demo_data = FALSE)::integer
        AS "nonDemoCount"
    FROM satellite_hotspots AS hotspot
    WHERE (${from}::timestamptz IS NULL OR hotspot.acquired_at >= ${from})
      AND (
        ${toExclusive}::timestamptz IS NULL OR
        hotspot.acquired_at < ${toExclusive}
      )
      AND (
        ${zoneId}::uuid IS NULL OR EXISTS (
          SELECT 1
          FROM forest_zones AS zone
          WHERE zone.id = ${zoneId}::uuid
            AND ST_Intersects(zone.boundary, hotspot.location)
        )
      )
  `;

  return rows[0] ?? { demoCount: 0, nonDemoCount: 0, totalCount: 0 };
}

export async function getMrvReportSource(
  filters: MrvReportFilters,
  currentTime = new Date(),
): Promise<MrvReportSource | null> {
  const selectedZone = filters.zoneId
    ? await prisma.forestZone.findUnique({
        where: { id: filters.zoneId },
        select: { id: true },
      })
    : null;

  if (filters.zoneId && !selectedZone) {
    return null;
  }

  const [reports, hotspots, carbonSnapshots] = await Promise.all([
    getReportAggregate(filters),
    getHotspotAggregate(filters),
    getCarbonSnapshots(filters, currentTime),
  ]);

  const approvedSnapshotZones = carbonSnapshots.filter(
    (snapshot) => snapshot.isZoneApproved,
  );

  return {
    carbonSnapshotAsOf: snapshotAsOf(filters, currentTime).toISOString(),
    hasCarbonSnapshot: carbonSnapshots.length > 0,
    hotspots,
    reports,
    zones: approvedSnapshotZones.map((snapshot): CarbonSnapshotZoneValues => ({
      areaHectares: snapshot.areaHectares,
      biomassFactor: snapshot.biomassFactor,
      co2ConversionFactor: snapshot.co2ConversionFactor,
      emissionFactor: snapshot.emissionFactor,
      incentivePerTonIdr: snapshot.incentivePerTonIdr,
      isDemoData: snapshot.isDemoData,
      name: snapshot.name,
      parameterIsDemoData: snapshot.isParameterDemoData,
      parameterSetId: snapshot.parameterSetId,
      snapshotAt: snapshot.snapshotAt.toISOString(),
      snapshotReason: snapshot.snapshotReason,
      villageName: snapshot.villageName,
      zoneId: snapshot.zoneId,
      zoneName: snapshot.zoneName,
    })),
  };
}
