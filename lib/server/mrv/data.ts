import "server-only";

import { getCarbonHistory } from "@/lib/server/mrv/carbon-history";
import { parseDashboardFilters } from "@/lib/server/mrv/validation";
import { prisma } from "@/lib/prisma";
import { API_ROUTES } from "@/lib/routes";
import {
  buildMrvDashboard,
  calculateZoneImpact,
} from "@/lib/server/mrv/calculations";
import { parseMrvLedgerAuditHistory } from "@/lib/mrv/audit-history";
import type {
  ApprovedZoneValues,
  DashboardFilters,
  LedgerFilters,
  MrvDashboard,
  MrvDataset,
  MrvLedger,
  MrvLedgerRow,
  ReadinessComponents,
  VillageActivity,
  ZoneImpact,
} from "@/lib/server/mrv/contracts";

type CarbonZoneRow = ApprovedZoneValues;

type VillageActivityRow = VillageActivity;

export async function getApprovedZoneValues(
  zoneId: string | null = null,
  dataset?: MrvDataset,
): Promise<CarbonZoneRow[]> {
  const illustrative = dataset ? dataset === "simulation" : null;
  return prisma.$queryRaw<CarbonZoneRow[]>`
    SELECT
      zone.id::text AS "zoneId",
      zone.zone_name AS "zoneName",
      zone.village_name AS "villageName",
      zone.area_hectares::double precision AS "areaHectares",
      zone.is_demo_data AS "isDemoData",
      parameters.id::text AS "parameterSetId",
      parameters.name AS name,
      parameters.source AS "parameterSource",
      parameters.biomass_factor::double precision AS "biomassFactor",
      parameters.emission_factor::double precision AS "emissionFactor",
      parameters.co2_conversion_factor::double precision AS "co2ConversionFactor",
      parameters.incentive_per_ton_idr::double precision AS "incentivePerTonIdr",
      parameters.is_demo_data AS "parameterIsDemoData",
      EXISTS (
        SELECT 1 FROM forest_zones other
        INNER JOIN carbon_parameter_sets other_params ON other_params.id = other.carbon_parameter_set_id
        WHERE other.id <> zone.id AND other.is_approved AND other.archived_at IS NULL
          AND (${illustrative}::boolean IS NULL OR (other.is_demo_data OR other_params.is_demo_data) = ${illustrative})
          AND other.boundary && zone.boundary AND ST_Relate(other.boundary, zone.boundary, '2********')
      ) AS "overlapsApprovedZone"
    FROM forest_zones AS zone
    INNER JOIN carbon_parameter_sets AS parameters
      ON parameters.id = zone.carbon_parameter_set_id
    WHERE zone.is_approved = TRUE AND zone.archived_at IS NULL
      AND (${illustrative}::boolean IS NULL OR (zone.is_demo_data OR parameters.is_demo_data) = ${illustrative})
      AND (${zoneId}::uuid IS NULL OR zone.id = ${zoneId}::uuid)
    ORDER BY zone.zone_name ASC, zone.id ASC
  `;
}

async function getVillageActivity(
  filters: DashboardFilters,
  end: Date,
  historical: boolean,
): Promise<VillageActivityRow[]> {
  const from = filters.range?.from ?? null;
  const illustrative = filters.dataset
    ? filters.dataset === "simulation"
    : null;

  return prisma.$queryRaw<VillageActivityRow[]>`
    SELECT
      COALESCE(
        NULLIF(CASE WHEN ${historical} THEN zone_at_cutoff.village_name ELSE zone.village_name END, ''),
        NULLIF(reporter.village_name, ''),
        'Tidak diketahui'
      ) AS "villageName",
      COUNT(report.id) FILTER (WHERE report.is_demo_sample = FALSE)::integer
        AS "fieldReportCount",
      COUNT(report.id) FILTER (WHERE report.is_demo_sample = TRUE)::integer
        AS "demoFieldReportCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = FALSE AND report.ai_state = 'COMPLETED'
          AND (NOT ${historical} OR report.ai_analyzed_at < ${end})
      )::integer AS "aiTriagedFieldReportCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = TRUE AND report.ai_state = 'COMPLETED'
          AND (NOT ${historical} OR report.ai_analyzed_at < ${end})
      )::integer AS "demoAiTriagedFieldReportCount"
    FROM field_reports AS report
    INNER JOIN users AS reporter ON reporter.id = report.reporter_id
    LEFT JOIN forest_zones AS zone ON zone.id = report.zone_id
    LEFT JOIN LATERAL (
      SELECT snapshot.village_name
      FROM forest_zone_carbon_snapshots AS snapshot
      WHERE ${historical} AND snapshot.zone_id = report.zone_id AND snapshot.captured_at < ${end}
      ORDER BY snapshot.captured_at DESC, snapshot.id DESC LIMIT 1
    ) AS zone_at_cutoff ON TRUE
    WHERE (${from}::timestamptz IS NULL OR report.captured_at >= ${from})
      AND (${illustrative}::boolean IS NULL OR report.is_demo_sample = ${illustrative})
      AND report.captured_at < ${end} AND report.created_at < ${end}
    GROUP BY 1
    ORDER BY 1 ASC
  `;
}

export async function getMrvDashboard(
  filters: DashboardFilters,
): Promise<MrvDashboard> {
  const now = new Date();
  const historicalEnd = filters.range?.toExclusive;
  const historical = Boolean(historicalEnd && historicalEnd <= now);
  const end = historical && historicalEnd ? historicalEnd : now;
  const day = (date: Date) =>
    new Date(date.getTime() + 7 * 3600_000).toISOString().slice(0, 10);
  const to = filters.range?.toDate ?? day(now);
  const from =
    filters.range?.fromDate ?? day(new Date(end.getTime() - 29 * 86400_000));
  const defaultRange = parseDashboardFilters(new URLSearchParams({ from, to }));
  const readinessFrom =
    filters.range?.from ??
    (defaultRange.ok ? (defaultRange.value.range?.from ?? now) : now);
  const lastMonth = day(
    end.getTime() === now.getTime() ? end : new Date(end.getTime() - 1),
  ).slice(0, 7);
  const [year, month] = lastMonth.split("-").map(Number);
  const months = Array.from({ length: 12 }, (_, i) => {
    const start = new Date(Date.UTC(year, month - 12 + i, 1));
    const monthEnd = new Date(
      Date.UTC(year, month - 11 + i, 1) - 7 * 3600_000 - 1,
    );
    return {
      month: start.toISOString().slice(0, 7),
      asOf: monthEnd < end ? monthEnd : new Date(end.getTime() - 1),
      partial: monthEnd >= end,
    };
  }).filter((item) => !filters.range?.from || item.asOf >= filters.range.from);
  const dates = [
    ...months.map((item) => item.asOf),
    new Date(end.getTime() - 1),
  ];
  const [zones, activity, history, readinessRows] = await Promise.all([
    getApprovedZoneValues(null, filters.dataset),
    getVillageActivity(filters, end, historical),
    getCarbonHistory(dates, null, filters.dataset),
    getReadinessRows(readinessFrom, end, filters.dataset),
  ]);
  const dashboard = buildMrvDashboard(zones, activity, filters, now);
  const cutoff = history[months.length];
  const readinessZones = cutoff.hasSnapshot ? cutoff.zones : [];
  for (const village of dashboard.villages) {
    const eligibleZones = new Set(
      readinessZones
        .filter(
          (zone) =>
            (zone.villageName?.trim() || "Tidak diketahui") ===
            village.villageName,
        )
        .map((zone) => zone.zoneId),
    );
    const visited = new Set<string>();
    let eligibleReports = 0;
    let timelyReports = 0;
    for (const row of readinessRows) {
      if (!row.zoneId || !eligibleZones.has(row.zoneId)) continue;
      visited.add(row.zoneId);
      if (row.eligible) {
        eligibleReports++;
        if (row.timely) timelyReports++;
      }
    }
    const components: ReadinessComponents = {
      patrolledZones: visited.size,
      zoneCount: eligibleZones.size,
      timelyReports,
      eligibleReports,
    };
    village.readinessComponents = components;
    if (components.zoneCount && components.eligibleReports) {
      village.readinessScore = Math.round(
        (50 * components.patrolledZones) / components.zoneCount +
          (50 * components.timelyReports) / components.eligibleReports,
      );
    }
  }

  return {
    ...dashboard,
    readiness: { status: "available", from, to },
    carbonTrend: {
      status: "available",
      months: months.map(({ month, partial }, index) => ({
        month,
        partial,
        carbonTons: history[index].hasSnapshot
          ? history[index].totals.estimatedCarbonTons
          : null,
      })),
    },
  };
}

function getReadinessRows(from: Date, end: Date, dataset?: MrvDataset) {
  const illustrative = dataset ? dataset === "simulation" : null;
  return prisma.$queryRaw<
    Array<{ zoneId: string | null; eligible: boolean; timely: boolean }>
  >`
    SELECT report.zone_id::text AS "zoneId",
      (report.created_at + interval '24 hours' <= ${end}) AS eligible,
      EXISTS (
        SELECT 1 FROM report_status_events event
        WHERE event.report_id = report.id AND event.next_status = 'DALAM_PENANGANAN'
          AND event.created_at >= report.created_at
          AND event.created_at <= report.created_at + interval '24 hours'
          AND event.created_at < ${end}
      ) AS timely
    FROM field_reports report
    WHERE report.captured_at >= ${from} AND report.captured_at < ${end} AND report.created_at < ${end}
      AND (${illustrative}::boolean IS NULL OR report.is_demo_sample = ${illustrative})
  `;
}

function getCurrentZoneContext(report: {
  zone: {
    areaHectares: unknown;
    carbonParameterSet: {
      biomassFactor: unknown;
      co2ConversionFactor: unknown;
      emissionFactor: unknown;
      incentivePerTonIdr: unknown;
      isDemoData: boolean;
      name: string;
      id: string;
    };
    id: string;
    isApproved: boolean;
    isDemoData: boolean;
    villageName: string | null;
    zoneName: string;
  } | null;
}):
  | (ZoneImpact & {
      attribution: "current_zone_context_not_patrol_contribution";
    })
  | null {
  const zone = report.zone;

  if (!zone?.isApproved) {
    return null;
  }

  const impact = calculateZoneImpact({
    areaHectares: Number(zone.areaHectares),
    biomassFactor: Number(zone.carbonParameterSet.biomassFactor),
    co2ConversionFactor: Number(zone.carbonParameterSet.co2ConversionFactor),
    emissionFactor: Number(zone.carbonParameterSet.emissionFactor),
    incentivePerTonIdr: Number(zone.carbonParameterSet.incentivePerTonIdr),
    isDemoData: zone.isDemoData,
    name: zone.carbonParameterSet.name,
    parameterIsDemoData: zone.carbonParameterSet.isDemoData,
    parameterSetId: zone.carbonParameterSet.id,
    villageName: zone.villageName,
    zoneId: zone.id,
    zoneName: zone.zoneName,
  });

  return {
    ...impact,
    attribution: "current_zone_context_not_patrol_contribution",
  };
}

function toLedgerRow(report: {
  aiCategory: string | null;
  aiConfidence: unknown;
  aiState: string | null;
  aiUrgency: string | null;
  accuracyMeters: number | null;
  capturedAt: Date;
  createdAt: Date;
  handlingStatus: string;
  id: string;
  imagePath: string;
  isDemoSample: boolean;
  latitude: number;
  longitude: number;
  syncedAt: Date;
  auditEvents: Array<{
    actor: { role: string } | null;
    createdAt: Date;
    eventType: string;
    id: string;
    payload: unknown;
  }>;
  statusEvents: Array<{
    changedBy: { role: string };
    createdAt: Date;
    id: string;
    nextStatus: string;
    previousStatus: string | null;
  }>;
  zone: {
    areaHectares: unknown;
    carbonParameterSet: {
      biomassFactor: unknown;
      co2ConversionFactor: unknown;
      emissionFactor: unknown;
      incentivePerTonIdr: unknown;
      isDemoData: boolean;
      name: string;
      id: string;
    };
    id: string;
    isApproved: boolean;
    isDemoData: boolean;
    villageName: string | null;
    zoneName: string;
  } | null;
}): MrvLedgerRow {
  const hasPhoto = report.imagePath.length > 0;

  return {
    aiTriage: {
      category: report.aiCategory,
      confidence:
        report.aiConfidence === null ? null : Number(report.aiConfidence),
      state: report.aiState,
      urgency: report.aiUrgency,
    },
    coordinates: {
      accuracyMeters:
        report.accuracyMeters !== null && Number.isFinite(report.accuracyMeters)
          ? report.accuracyMeters
          : null,
      latitude: report.latitude,
      longitude: report.longitude,
      status: "recorded_not_verified",
    },
    createdAt: report.createdAt.toISOString(),
    capturedAt: report.capturedAt.toISOString(),
    evidenceStatus:
      Number.isFinite(report.latitude) &&
      Number.isFinite(report.longitude) &&
      hasPhoto
        ? "complete"
        : "incomplete",
    hasPhoto,
    handlingStatus: report.handlingStatus,
    isDemoSample: report.isDemoSample,
    photoHref: hasPhoto ? API_ROUTES.reports.photo(report.id) : null,
    reportId: report.id,
    auditHistory: parseMrvLedgerAuditHistory(report.auditEvents),
    statusHistory: report.statusEvents.map((event) => ({
      actorRole: event.changedBy.role,
      createdAt: event.createdAt.toISOString(),
      eventId: event.id,
      nextStatus: event.nextStatus,
      previousStatus: event.previousStatus,
    })),
    syncedAt: report.syncedAt.toISOString(),
    villageName: report.zone?.villageName ?? null,
    zoneName: report.zone?.zoneName ?? null,
    zoneImpactContext: getCurrentZoneContext(report),
  };
}

export async function getMrvLedger(filters: LedgerFilters): Promise<MrvLedger> {
  const aiState = filters.aiState;
  const where = {
    ...(filters.reportId ? { id: filters.reportId } : {}),
    ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
    ...(filters.range
      ? {
          capturedAt: {
            gte: filters.range.from ?? undefined,
            lt: filters.range.toExclusive ?? undefined,
          },
        }
      : {}),
    ...(aiState ? { aiState } : {}),
    ...(filters.evidence === "complete" ? { imagePath: { not: "" } } : {}),
  };

  const [reports, total] = await Promise.all([
    prisma.fieldReport.findMany({
      where,
      orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
      skip: (filters.page - 1) * filters.pageSize,
      take: filters.pageSize,
      select: {
        id: true,
        latitude: true,
        longitude: true,
        accuracyMeters: true,
        imagePath: true,
        capturedAt: true,
        syncedAt: true,
        createdAt: true,
        aiState: true,
        aiCategory: true,
        aiUrgency: true,
        aiConfidence: true,
        handlingStatus: true,
        isDemoSample: true,
        zone: {
          select: {
            id: true,
            zoneName: true,
            villageName: true,
            areaHectares: true,
            isApproved: true,
            isDemoData: true,
            carbonParameterSet: {
              select: {
                id: true,
                name: true,
                biomassFactor: true,
                emissionFactor: true,
                co2ConversionFactor: true,
                incentivePerTonIdr: true,
                isDemoData: true,
              },
            },
          },
        },
        statusEvents: {
          orderBy: { createdAt: "asc" },
          select: {
            id: true,
            previousStatus: true,
            nextStatus: true,
            createdAt: true,
            changedBy: { select: { role: true } },
          },
        },
        auditEvents: {
          where: {
            eventType: {
              in: [
                "MRV_EVIDENCE_REVIEWED",
                "REPORT_AI_ANALYSIS_COMPLETED",
                "REPORT_AI_ANALYSIS_FAILED",
                "REPORT_EVIDENCE_RECORDED",
                "MRV_EVIDENCE_SUPPLEMENTED",
                "REPORT_AI_REQUEUED",
                "REPORT_AI_RETRY_SCHEDULED",
              ],
            },
          },
          orderBy: [{ createdAt: "asc" }, { id: "asc" }],
          select: {
            id: true,
            eventType: true,
            payload: true,
            createdAt: true,
            actor: { select: { role: true } },
          },
        },
      },
    }),
    prisma.fieldReport.count({ where }),
  ]);

  return {
    filters: {
      aiState: filters.aiState,
      evidence: filters.evidence,
      from: filters.range?.fromDate ?? null,
      reportId: filters.reportId,
      to: filters.range?.toDate ?? null,
      zoneId: filters.zoneId,
    },
    page: filters.page,
    pageSize: filters.pageSize,
    rows: reports.map(toLedgerRow),
    total,
  };
}

export async function listSubmittedEvidence(before?: Date) {
  return prisma.$queryRaw<Array<{ reportId: string; submittedAt: Date }>>`
    WITH latest AS (
      SELECT DISTINCT ON (report_id) report_id, event_type, created_at
      FROM audit_events WHERE event_type IN ('MRV_EVIDENCE_REVIEWED', 'MRV_EVIDENCE_SUPPLEMENTED')
      ORDER BY report_id, created_at DESC, id DESC
    )
    SELECT report_id::text AS "reportId", created_at AS "submittedAt"
    FROM latest WHERE event_type = 'MRV_EVIDENCE_SUPPLEMENTED'
      AND (${before ?? null}::timestamptz IS NULL OR created_at < ${before ?? null})
    ORDER BY created_at DESC, report_id LIMIT 21
  `;
}
