import "server-only";

import { prisma } from "@/lib/prisma";
import { getApprovedZoneValues } from "@/lib/server/mrv/data";
import type {
  ApprovedZoneValues,
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
  hotspots: HotspotAggregateRow;
  reports: ReportAggregateRow;
  zones: ApprovedZoneValues[];
};

function reportRangeBounds(filters: MrvReportFilters) {
  return {
    from: filters.range?.from ?? null,
    toExclusive: filters.range?.toExclusive ?? null,
  };
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
            AND zone.is_approved = TRUE
            AND ST_Intersects(zone.boundary, hotspot.location)
        )
      )
  `;

  return rows[0] ?? { demoCount: 0, nonDemoCount: 0, totalCount: 0 };
}

export async function getMrvReportSource(
  filters: MrvReportFilters,
): Promise<MrvReportSource | null> {
  const zones = await getApprovedZoneValues(filters.zoneId);

  if (filters.zoneId && zones.length === 0) {
    return null;
  }

  const [reports, hotspots] = await Promise.all([
    getReportAggregate(filters),
    getHotspotAggregate(filters),
  ]);

  return { hotspots, reports, zones };
}
