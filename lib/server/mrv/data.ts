import "server-only";

import { prisma } from "@/lib/prisma";
import {
  buildMrvDashboard,
  calculateZoneImpact,
} from "@/lib/server/mrv/calculations";
import type {
  ApprovedZoneValues,
  DashboardFilters,
  LedgerFilters,
  MrvDashboard,
  MrvLedger,
  MrvLedgerRow,
  VillageActivity,
  ZoneImpact,
} from "@/lib/server/mrv/contracts";

type CarbonZoneRow = ApprovedZoneValues;

type VillageActivityRow = VillageActivity;

export async function getApprovedZoneValues(
  zoneId: string | null = null,
): Promise<CarbonZoneRow[]> {
  return prisma.$queryRaw<CarbonZoneRow[]>`
    SELECT
      zone.id::text AS "zoneId",
      zone.zone_name AS "zoneName",
      zone.village_name AS "villageName",
      zone.area_hectares::double precision AS "areaHectares",
      zone.is_demo_data AS "isDemoData",
      parameters.id::text AS "parameterSetId",
      parameters.name AS name,
      parameters.biomass_factor::double precision AS "biomassFactor",
      parameters.emission_factor::double precision AS "emissionFactor",
      parameters.co2_conversion_factor::double precision AS "co2ConversionFactor",
      parameters.incentive_per_ton_idr::double precision AS "incentivePerTonIdr",
      parameters.is_demo_data AS "parameterIsDemoData"
    FROM forest_zones AS zone
    INNER JOIN carbon_parameter_sets AS parameters
      ON parameters.id = zone.carbon_parameter_set_id
    WHERE zone.is_approved = TRUE
      AND (${zoneId}::uuid IS NULL OR zone.id = ${zoneId}::uuid)
    ORDER BY zone.zone_name ASC, zone.id ASC
  `;
}

async function getVillageActivity(
  filters: DashboardFilters,
): Promise<VillageActivityRow[]> {
  const from = filters.range?.from ?? null;
  const toExclusive = filters.range?.toExclusive ?? null;

  return prisma.$queryRaw<VillageActivityRow[]>`
    SELECT
      COALESCE(
        NULLIF(zone.village_name, ''),
        NULLIF(reporter.village_name, ''),
        'Tidak diketahui'
      ) AS "villageName",
      COUNT(report.id) FILTER (WHERE report.is_demo_sample = FALSE)::integer
        AS "fieldReportCount",
      COUNT(report.id) FILTER (WHERE report.is_demo_sample = TRUE)::integer
        AS "demoFieldReportCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = FALSE AND report.ai_state = 'COMPLETED'
      )::integer AS "aiTriagedFieldReportCount",
      COUNT(report.id) FILTER (
        WHERE report.is_demo_sample = TRUE AND report.ai_state = 'COMPLETED'
      )::integer AS "demoAiTriagedFieldReportCount"
    FROM field_reports AS report
    INNER JOIN users AS reporter ON reporter.id = report.reporter_id
    LEFT JOIN forest_zones AS zone ON zone.id = report.zone_id
    WHERE (${from}::timestamptz IS NULL OR report.captured_at >= ${from})
      AND (
        ${toExclusive}::timestamptz IS NULL OR
        report.captured_at < ${toExclusive}
      )
    GROUP BY 1
    ORDER BY 1 ASC
  `;
}

export async function getMrvDashboard(
  filters: DashboardFilters,
): Promise<MrvDashboard> {
  const [zones, activity] = await Promise.all([
    getApprovedZoneValues(null),
    getVillageActivity(filters),
  ]);

  return buildMrvDashboard(zones, activity, filters, new Date());
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
      hasPhoto &&
      report.aiState === "COMPLETED"
        ? "complete"
        : "incomplete",
    hasPhoto,
    handlingStatus: report.handlingStatus,
    isDemoSample: report.isDemoSample,
    photoHref: hasPhoto ? `/api/reports/${report.id}/photo` : null,
    reportId: report.id,
    statusHistory: report.statusEvents.map((event) => ({
      actorRole: event.changedBy.role,
      createdAt: event.createdAt.toISOString(),
      eventId: event.id,
      nextStatus: event.nextStatus,
      previousStatus: event.previousStatus,
    })),
    syncedAt: report.syncedAt.toISOString(),
    villageName: report.zone?.villageName ?? null,
    zoneImpactContext: getCurrentZoneContext(report),
  };
}

export async function getMrvLedger(filters: LedgerFilters): Promise<MrvLedger> {
  const aiState =
    filters.evidence === "complete" ? "COMPLETED" : filters.aiState;
  const where = {
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
      },
    }),
    prisma.fieldReport.count({ where }),
  ]);

  return {
    filters: {
      aiState: filters.aiState,
      evidence: filters.evidence,
      from: filters.range?.fromDate ?? null,
      to: filters.range?.toDate ?? null,
      zoneId: filters.zoneId,
    },
    page: filters.page,
    pageSize: filters.pageSize,
    rows: reports.map(toLedgerRow),
    total,
  };
}
