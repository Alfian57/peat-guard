import { getLatestEvidenceVersion } from "@/lib/server/mrv/follow-up";
import { isRecord } from "@/lib/server/command/http";
import "server-only";

import { prisma } from "@/lib/prisma";
import { reportReadScope, type ReportActor } from "@/lib/server/reports/access";
import { ReportNotFoundError } from "@/lib/server/reports/http";
import type { ReportListFilters } from "@/lib/server/reports/list-input";
import { reportPhotoMetadata } from "@/lib/server/reports/photo-metadata";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isReportUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

const reportDetailSelect = {
  id: true,
  clientReportId: true,
  zoneId: true,
  latitude: true,
  longitude: true,
  accuracyMeters: true,
  fieldNotes: true,
  canalCondition: true,
  canalObservation: true,
  tags: true,
  capturedAt: true,
  syncedAt: true,
  aiConsent: true,
  aiState: true,
  aiCategory: true,
  aiUrgency: true,
  aiConfidence: true,
  aiSummary: true,
  aiVisualIndicators: true,
  aiFalsePositiveCheck: true,
  aiActionRecommendations: true,
  aiAnalyzedAt: true,
  handlingStatus: true,
  nearestWaterDistanceM: true,
  isDemoSample: true,
  imagePath: true,
  createdAt: true,
  updatedAt: true,
  statusEvents: {
    select: {
      id: true,
      previousStatus: true,
      nextStatus: true,
      note: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" as const },
  },
};

export async function getPrivateReportList(
  actor: ReportActor,
  filters: ReportListFilters,
) {
  const capturedAt: { gte?: Date; lt?: Date } = {};
  if (filters.from) capturedAt.gte = filters.from;
  if (filters.toExclusive) capturedAt.lt = filters.toExclusive;

  const where = {
    ...reportReadScope(actor),
    ...(filters.status ? { handlingStatus: filters.status } : {}),
    ...(filters.zoneId ? { zoneId: filters.zoneId } : {}),
    ...(filters.isDemoSample === null
      ? {}
      : { isDemoSample: filters.isDemoSample }),
    ...(Object.keys(capturedAt).length > 0 ? { capturedAt } : {}),
  };

  const offset = (filters.page - 1) * filters.pageSize;
  const select = {
    id: true,
    zoneId: true,
    latitude: true,
    longitude: true,
    accuracyMeters: true,
    capturedAt: true,
    syncedAt: true,
    handlingStatus: true,
    aiState: true,
    aiCategory: true,
    aiUrgency: true,
    imagePath: true,
    isDemoSample: true,
  } as const;

  const [reports, total, pendingIds] =
    actor.role === "RELAWAN"
      ? await prisma.$transaction(async (tx) => {
          // Prioritize the latest evidence version before applying pagination.
          const page = await tx.$queryRaw<
            Array<{ id: string; needsFollowUp: boolean }>
          >`
            SELECT report.id::text AS id, COALESCE(
              evidence.event_type = 'MRV_EVIDENCE_REVIEWED'
              AND evidence.payload->>'decision' = 'NEEDS_FOLLOW_UP'
              AND jsonb_typeof(evidence.payload->'note') = 'string',
              FALSE
            ) AS "needsFollowUp"
            FROM field_reports AS report
            LEFT JOIN LATERAL (
              SELECT event_type, payload
              FROM audit_events
              WHERE report_id = report.id
                AND event_type IN ('MRV_EVIDENCE_REVIEWED', 'MRV_EVIDENCE_SUPPLEMENTED')
              ORDER BY created_at DESC, id DESC LIMIT 1
            ) AS evidence ON TRUE
            WHERE report.reporter_id = ${actor.id}::uuid
              AND (${filters.status}::text IS NULL OR report.handling_status::text = ${filters.status})
              AND (${filters.zoneId}::uuid IS NULL OR report.zone_id = ${filters.zoneId}::uuid)
              AND (${filters.isDemoSample}::boolean IS NULL OR report.is_demo_sample = ${filters.isDemoSample})
              AND (${filters.from}::timestamptz IS NULL OR report.captured_at >= ${filters.from})
              AND (${filters.toExclusive}::timestamptz IS NULL OR report.captured_at < ${filters.toExclusive})
            ORDER BY "needsFollowUp" DESC, report.captured_at DESC, report.id DESC
            OFFSET ${offset} LIMIT ${filters.pageSize}
          `;
          const rows = await tx.fieldReport.findMany({
            where: { ...where, id: { in: page.map(({ id }) => id) } },
            select,
          });
          const byId = new Map(rows.map((report) => [report.id, report]));
          return [
            page.flatMap(({ id }) => byId.get(id) ?? []),
            await tx.fieldReport.count({ where }),
            new Set(
              page.filter((item) => item.needsFollowUp).map(({ id }) => id),
            ),
          ] as const;
        })
      : await prisma
          .$transaction([
            prisma.fieldReport.findMany({
              where,
              orderBy: [{ capturedAt: "desc" }, { id: "desc" }],
              skip: offset,
              take: filters.pageSize,
              select,
            }),
            prisma.fieldReport.count({ where }),
          ])
          .then(([rows, count]) => [rows, count, null] as const);

  return {
    reports: reports.map((report) => {
      const photo = reportPhotoMetadata(report.id, report.imagePath);
      return {
        id: report.id,
        zoneId: report.zoneId,
        latitude: report.latitude,
        longitude: report.longitude,
        accuracyMeters: report.accuracyMeters,
        capturedAt: report.capturedAt,
        syncedAt: report.syncedAt,
        handlingStatus: report.handlingStatus,
        aiState: report.aiState,
        aiCategory: report.aiCategory,
        aiUrgency: report.aiUrgency,
        isDemoSample: report.isDemoSample,
        ...(pendingIds ? { needsFollowUp: pendingIds.has(report.id) } : {}),
        ...photo,
      };
    }),
    page: filters.page,
    pageSize: filters.pageSize,
    total,
  };
}

export async function getPrivateReportDetail(
  actor: ReportActor,
  reportId: string,
) {
  const report = await prisma.fieldReport.findFirst({
    where: { id: reportId, ...reportReadScope(actor) },
    select: reportDetailSelect,
  });

  if (!report) throw new ReportNotFoundError();

  const photo = reportPhotoMetadata(report.id, report.imagePath);
  const latestEvidence = await getLatestEvidenceVersion(prisma, report.id);
  const evidencePayload =
    latestEvidence && isRecord(latestEvidence.payload)
      ? latestEvidence.payload
      : null;
  const followUp =
    latestEvidence?.eventType === "MRV_EVIDENCE_REVIEWED" &&
    evidencePayload?.decision === "NEEDS_FOLLOW_UP" &&
    typeof evidencePayload.note === "string"
      ? { reviewId: latestEvidence.id, note: evidencePayload.note }
      : null;
  return {
    id: report.id,
    clientReportId: report.clientReportId,
    zoneId: report.zoneId,
    latitude: report.latitude,
    longitude: report.longitude,
    accuracyMeters: report.accuracyMeters,
    fieldNotes: report.fieldNotes,
    canalCondition: report.canalCondition,
    canalObservation: report.canalObservation,
    followUp,
    tags: report.tags,
    capturedAt: report.capturedAt,
    syncedAt: report.syncedAt,
    aiConsent: report.aiConsent,
    aiState: report.aiState,
    aiCategory: report.aiCategory,
    aiUrgency: report.aiUrgency,
    aiConfidence:
      report.aiConfidence === null ? null : Number(report.aiConfidence),
    aiSummary: report.aiSummary,
    aiVisualIndicators: report.aiVisualIndicators,
    aiFalsePositiveCheck: report.aiFalsePositiveCheck,
    aiActionRecommendations: report.aiActionRecommendations,
    aiAnalyzedAt: report.aiAnalyzedAt,
    handlingStatus: report.handlingStatus,
    nearestWaterDistanceM:
      report.nearestWaterDistanceM === null
        ? null
        : Number(report.nearestWaterDistanceM),
    isDemoSample: report.isDemoSample,
    ...photo,
    createdAt: report.createdAt,
    updatedAt: report.updatedAt,
    statusEvents: report.statusEvents,
  };
}

export async function getPrivateReportPhotoPath(
  actor: ReportActor,
  reportId: string,
): Promise<string> {
  const report = await prisma.fieldReport.findFirst({
    where: { id: reportId, ...reportReadScope(actor) },
    select: { imagePath: true },
  });

  if (!report) throw new ReportNotFoundError();
  return report.imagePath;
}
