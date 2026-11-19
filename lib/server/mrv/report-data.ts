import "server-only";

import { getCarbonHistory } from "./carbon-history";
import type { CanalCondition } from "@/lib/canal-observation";
import { prisma } from "@/lib/prisma";
import type {
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
  acceptedEvidenceCount?: number;
  followUpEvidenceCount?: number;
  rejectedEvidenceCount?: number;
};

export type HotspotAggregateRow = {
  demoCount: number;
  nonDemoCount: number;
  totalCount: number;
  historicalBoundaryUnavailable?: boolean;
};

export type MrvReportSource = {
  carbonSnapshotAsOf: string;
  hasCarbonSnapshot: boolean;
  excludedZoneCount?: number;
  partial?: boolean;
  priorCarbonTons?: number | null;
  priorZones?: CarbonSnapshotZoneValues[];
  canalObservations?: Array<{
    condition: CanalCondition;
    demoCount: number;
    nonDemoCount: number;
  }>;
  zoneName?: string | null;
  hotspots: HotspotAggregateRow;
  reports: ReportAggregateRow;
  zones: CarbonSnapshotZoneValues[];
};

function reportRangeBounds(filters: MrvReportFilters, now: Date) {
  return {
    from: filters.range?.from ?? null,
    toExclusive:
      filters.range?.toExclusive && filters.range.toExclusive <= now
        ? filters.range.toExclusive
        : now,
    historical: filters.range?.toExclusive
      ? filters.range.toExclusive <= now
      : false,
  };
}

async function getReportAggregate(
  filters: MrvReportFilters,
  now: Date,
): Promise<ReportAggregateRow> {
  const { from, toExclusive, historical } = reportRangeBounds(filters, now);
  const zoneId = filters.zoneId;
  const rows = await prisma.$queryRaw<ReportAggregateRow[]>`
    WITH filtered_reports AS (
      SELECT
        report.id,
        report.created_at,
        CASE WHEN ${historical} THEN COALESCE(last_status.next_status::text, 'MENUNGGU_TINDAKAN')
          ELSE report.handling_status::text END AS handling_status,
        CASE WHEN NOT ${historical} OR report.ai_analyzed_at < ${toExclusive}
          THEN report.ai_state::text END AS ai_state,
        evidence.decision AS evidence_decision,
        report.is_demo_sample
      FROM field_reports AS report
      LEFT JOIN LATERAL (
        SELECT event.next_status FROM report_status_events event
        WHERE ${historical} AND event.report_id = report.id AND event.created_at < ${toExclusive}
        ORDER BY event.created_at DESC, event.id DESC LIMIT 1
      ) last_status ON TRUE
      LEFT JOIN LATERAL (
        SELECT event.payload->>'decision' AS decision FROM audit_events event
        WHERE event.report_id = report.id AND event.event_type = 'MRV_EVIDENCE_REVIEWED'
          AND event.created_at < ${toExclusive}
        ORDER BY event.created_at DESC, event.id DESC LIMIT 1
      ) evidence ON TRUE
      WHERE report.created_at < ${toExclusive}
        AND (${from}::timestamptz IS NULL OR report.captured_at >= ${from})
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
      WHERE event.next_status = 'DALAM_PENANGANAN' AND event.created_at < ${toExclusive}
      GROUP BY event.report_id
    )
    SELECT
      COUNT(report.id)::integer AS "totalCount",
      COUNT(*) FILTER (WHERE report.evidence_decision = 'ACCEPTED')::int AS "acceptedEvidenceCount",
      COUNT(*) FILTER (WHERE report.evidence_decision = 'NEEDS_FOLLOW_UP')::int AS "followUpEvidenceCount",
      COUNT(*) FILTER (WHERE report.evidence_decision = 'REJECTED')::int AS "rejectedEvidenceCount",
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
      )) FILTER (WHERE response.report_id IS NOT NULL))::double precision AS "responseMinutes",
      (AVG(GREATEST(
        EXTRACT(EPOCH FROM (response.first_response_at - report.created_at)) / 60,
        0
      )) FILTER (WHERE response.report_id IS NOT NULL AND report.is_demo_sample = TRUE))::double precision
        AS "demoResponseMinutes",
      (AVG(GREATEST(
        EXTRACT(EPOCH FROM (response.first_response_at - report.created_at)) / 60,
        0
      )) FILTER (WHERE response.report_id IS NOT NULL AND report.is_demo_sample = FALSE))::double precision
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
  now: Date,
): Promise<HotspotAggregateRow> {
  const { from, toExclusive } = reportRangeBounds(filters, now);
  const zoneId = filters.zoneId;
  const [row] = await prisma.$queryRaw<HotspotAggregateRow[]>`
    WITH observations AS (
      SELECT hotspot.is_demo_data,
        CASE WHEN ${zoneId}::uuid IS NULL THEN TRUE
          WHEN history.boundary IS NULL THEN NULL
          ELSE history.is_zone_approved AND ST_Intersects(history.boundary, hotspot.location)
        END AS included
      FROM satellite_hotspots hotspot
      LEFT JOIN LATERAL (
        SELECT snapshot.boundary, snapshot.is_zone_approved FROM forest_zone_carbon_snapshots snapshot
        WHERE snapshot.zone_id = ${zoneId}::uuid AND snapshot.captured_at <= hotspot.acquired_at
        ORDER BY snapshot.captured_at DESC, snapshot.id DESC LIMIT 1
      ) history ON TRUE
      WHERE (${from}::timestamptz IS NULL OR hotspot.acquired_at >= ${from})
        AND hotspot.acquired_at < ${toExclusive} AND hotspot.fetched_at < ${toExclusive}
    )
    SELECT COUNT(*) FILTER (WHERE included)::integer AS "totalCount",
      COUNT(*) FILTER (WHERE included AND is_demo_data)::integer AS "demoCount",
      COUNT(*) FILTER (WHERE included AND NOT is_demo_data)::integer AS "nonDemoCount",
      COALESCE(BOOL_OR(included IS NULL), FALSE) OR (
        ${zoneId}::uuid IS NOT NULL AND ${from}::timestamptz IS NOT NULL AND NOT EXISTS (
          SELECT 1 FROM forest_zone_carbon_snapshots
          WHERE zone_id = ${zoneId}::uuid AND boundary IS NOT NULL AND captured_at <= ${from}
        )
      ) AS "historicalBoundaryUnavailable"
    FROM observations
  `;
  return row;
}

function getCanalObservations(filters: MrvReportFilters, now: Date) {
  const { from, toExclusive } = reportRangeBounds(filters, now);
  const zoneId = filters.zoneId;
  return prisma.$queryRaw<NonNullable<MrvReportSource["canalObservations"]>>`
    SELECT canal_condition::text AS condition,
      COUNT(*) FILTER (WHERE is_demo_sample)::int AS "demoCount",
      COUNT(*) FILTER (WHERE NOT is_demo_sample)::int AS "nonDemoCount"
    FROM field_reports
    WHERE canal_condition IS NOT NULL AND created_at < ${toExclusive} AND captured_at < ${toExclusive}
      AND (${from}::timestamptz IS NULL OR captured_at >= ${from})
      AND (${zoneId}::uuid IS NULL OR zone_id = ${zoneId}::uuid)
    GROUP BY canal_condition ORDER BY canal_condition
  `;
}

export async function getMrvReportSource(
  filters: MrvReportFilters,
  currentTime = new Date(),
): Promise<MrvReportSource | null> {
  const zoneId = filters.zoneId;
  const { from, toExclusive } = reportRangeBounds(filters, currentTime);
  const asOf = new Date(toExclusive.getTime() - 1);
  const dates = [asOf];
  if (from) dates.push(new Date(from.getTime() - 1));
  const [reports, hotspots, history, canalObservations, selectedZone] =
    await Promise.all([
      getReportAggregate(filters, currentTime),
      getHotspotAggregate(filters, currentTime),
      getCarbonHistory(dates, zoneId),
      getCanalObservations(filters, currentTime),
      zoneId
        ? prisma.forestZone.findUnique({
            where: { id: zoneId },
            select: { zoneName: true },
          })
        : null,
    ]);
  if (zoneId && !selectedZone) return null;
  const [carbon, previous] = history;

  return {
    carbonSnapshotAsOf: asOf.toISOString(),
    hasCarbonSnapshot: carbon.hasSnapshot,
    excludedZoneCount: carbon.excludedCount,
    priorCarbonTons: previous?.hasSnapshot
      ? previous.totals.estimatedCarbonTons
      : null,
    priorZones: previous?.hasSnapshot ? previous.zones : undefined,
    partial: Boolean(
      filters.range?.toExclusive && filters.range.toExclusive > currentTime,
    ),
    zoneName:
      carbon.zones[0]?.zoneName ??
      (zoneId && !filters.range ? selectedZone?.zoneName : null),
    hotspots,
    reports,
    zones: carbon.zones,
    canalObservations,
  };
}
